/*

Node.js parser for MARC Files from Library of Congress
- Make network JSON files for consumption by sigma.js
- npm run download-data to get data files (you may have to install wget)
Jer Thorp (@blprnt)
December, 2017

*/

let request = require('request');
const fs = require('fs');  
const zlib = require('zlib');
const concat = require('concat-stream');
const xml2object = require('xml2object');
const appRoot = require('app-root-path');
const natural = require('natural');

var dataPath = appRoot + "/data";

const marc_location = dataPath;
//*
const filePrefix = "BooksAll";
const section = "PS";
const fileCount = 41;
//*/

/*
const filePrefix = "Visual.Materials";
const fileCount = 1;
const section = "all";
//*/

/*
const filePrefix = "Music";
const fileCount = 2;
const section = "all";
//*/




var docCount = 0;
var docCounts = [];
var callNumCounts = [];

var tinycolor = require("tinycolor2");
var colorSort = require('color-sort');
var colJSON = require(dataPath + "/xkcd.json");
var colList = [];

//Hilbert
var H = require('hilbert')




//XML Parser
var parser;
// Create a new xml parser looking for the record objects
function makeParser() {
	parser = new xml2object([ 'record' ]);
	parser.outs = [];

	parser.on('object', function(name, obj) {
		parseRecord(obj);
	});

	parser.on('end', function() {
	    console.log('Finished parsing xml!');
	    onParseFinished();
	});
}

//Record parser
//Parse MARC record into a usable JSON object
//https://folgerpedia.folger.edu/Interpreting_MARC_records#2xx
//SUPER rough for now!
const marcDict = {};
marcDict["245"] = {"*" :"Title"};

marcDict["260"] = {"c" :"Year"};
marcDict["100"] = {"a" :"Name"};
marcDict["050"] = {"a" :"CallNumber"};

marcDict["856"] = {"u" :"URL"};

var nameDict = {};
var lastNameDict = {};
var callDict = {};
var callYearTotals = [];

var allRecords = [];
 function parseRecord(obj) {
 	record = {};
	for (var i = 0; i < obj.datafield.length; i++) {
		var df = obj.datafield[i];
		//Get the numeric tag
		var tag  = df.tag;

		//If we have the tag in our dictionary, write to the JSON object
		//Based on the code (doesn't work for all cases?)
		if (marcDict[tag] && df.subfield) {
			var isAll = marcDict[tag]['*'];

			for (var j = 0; j < df.subfield.length; j++) {

				var code = isAll ? "*":df.subfield[j].code;
				var disp = df.subfield[j]['$t'];
				
				if (marcDict[tag][code] || isAll) {
					if (!record[marcDict[tag][code]]) {
						record[marcDict[tag][code]] = [];
					}
					record[marcDict[tag][code]].push(disp);
				}
			}
		}
	}

	if (record.Title) {

		if (record.Title.length > 0) {
			var t = record.Title.join(" ");
			
			var codeCheck = false;
			if (record.CallNumber && record.CallNumber[0]) {
				var cn = record.CallNumber[0].substring(0,2);
				if (cn.indexOf("}") == -1) {	
					if (cn == section || section == "all") codeCheck = true;
				}
			}

			if (codeCheck) {
				var chk = checkForColor(t);
				if (chk.chk) {
					//console.log(chk.col + ":" + t);
					chk.Title = record.Title;
					chk.CallNumber = record.CallNumber;
					if (record.URL) chk.URL = record.URL;
					colList.push(chk);
					if (colList.length == 500) writeColors();
			    }
			}
		}
	}
	
}

function checkForColor(_s) {
	var chk = {chk:false, col:null};
	for (var i = 0; i < colJSON.colors.length; i++) {
		if (_s.indexOf(" " + colJSON.colors[i].color + " ") != -1 || _s.indexOf(" " + colJSON.colors[i].color + ".") != -1) {
			chk.chk = true;
			chk.col = colJSON.colors[i].color;
			chk.hex = colJSON.colors[i].hex;
			
		}
	}
	return(chk);
}

function sortColors() {

	//Spin the colors a bit to give some range
	for (var i = 0; i < colList.length; i++) {
		var c = tinycolor(colList[i].hex);
		var spin = 10;
		c.spin((Math.random() * spin * 2) - spin);
		colList[i].hex = c.toHexString();
	}


	colList.sort(function(a,b) {
		var ca = tinycolor(a.hex);
		var cb = tinycolor(b.hex);


		
		var rgb1 = ca.toRgb();
		var rgb2 = cb.toRgb();


		//HBT
		/*
		var v1 = Math.sqrt((0.299 * (rgb1.r * rgb1.r)) + (0.587 * (rgb1.g * rgb1.g)) + (0.114 * (rgb1.b * rgb1.b)));
		var v2 = Math.sqrt((0.299 * (rgb2.r * rgb2.r)) + (0.587 * (rgb2.g * rgb2.g)) + (0.114 * (rgb2.b * rgb2.b)));
		//*/


		//Perceptual - luminance + hue + saturation
		/*
		var hsl1 = ca.toHsl();
		var hsl2 = cb.toHsl();

		var v1 = hsl1.l * 5 + hsl1.s * 2 + hsl1.h;
		var v2 = hsl2.l * 5 + hsl2.s * 2 + hsl2.h;
		//*/


		//Hilbert space
		var v1 = H.xyz2d(rgb1.r * 255, rgb1.g * 255, rgb1.b * 255);
		var v2 = H.xyz2d(rgb2.r * 255, rgb2.g * 255, rgb2.b * 255)
		return(v1 - v2);
	});
	
}

function writeColors() {
	sortColors();
	var json = JSON.stringify(colList, null, 2);
	//Write
	console.log("WRITING." + colList.length);
	fs.writeFile(dataPath + "/colors" + filePrefix + "_" + section + ".json", json, 'utf8', function() {
		console.log("Saved color JSON.");
	});
}


function incrementDict(dict, val, yi) {

			if (!dict[val]) {
		    	dict[val] = {
		    		"name":val,
		    		"total":0,
		    		"years":[],
		    		"callNums":{}
		    	};
		   	}
} 


function onParseFinished() {
	
	writeColors();
	try {
		nextFile();
	} catch(err) {
		//writeColors();
	}
}


var counter = 1;

function nextFile() {
	if (counter < fileCount + 1) {
	  var n = (counter < 10 ? "0":"") + counter;
	  var url = marc_location + "/" + filePrefix + ".2014.part" + n + ".xml.gz";
		var rstream = fs.createReadStream(url);
		var gunzip = zlib.createGunzip();
		makeParser();
		allRecords = [];

		console.log("LOADING FILE : " + url);
		
		
			rstream   // reads from myfile.txt.gz
			  .pipe(gunzip)  // uncompresses
			  .pipe(parser.saxStream); //Parses into record objects
		
		counter ++;
	}


}

nextFile();



