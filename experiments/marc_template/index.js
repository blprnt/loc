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
const filePrefix = "Visual.Materials"

var docCount = 0;
var docCounts = [];
var callNumCounts = [];




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
marcDict["245"] = {"a" :"Title"};

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
		if (marcDict[tag]) {
			for (var j = 0; j < df.subfield.length; j++) {
				var code = df.subfield[j].code;
				var disp = df.subfield[j]['$t'];
				
				if (marcDict[tag][code]) {
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
			var t = record.Title[0];
			var chk = checkForColor(t);
			if (chk.chk) console.log(chk.col + ":" + record.Title[0]);
		}
	}
	
}

function checkForColor(_s) {
	var colors = [" red"," blue"," green"];
	var chk = {chk:false, col:null};
	for (var i = 0; i < colors.length; i++) {
		if (_s.indexOf(colors[i]) != -1) {
			chk.chk = true;
			chk.col = colors[i];
		}
	}
	return(chk);
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
	
	nextFile();
}


var counter = 1;

function nextFile() {
  var n = (counter < 10 ? "0":"") + counter;
  var url = marc_location + "/" + filePrefix + ".2014.part" + n + ".xml.gz";
	var rstream = fs.createReadStream(url);
	var gunzip = zlib.createGunzip();
	makeParser();
	allRecords = [];

	console.log("LOADING FILE : " + url);
	counter ++;
	if (counter < 42) {
		rstream   // reads from myfile.txt.gz
		  .pipe(gunzip)  // uncompresses
		  .pipe(parser.saxStream); //Parses into record objects
	}


}

nextFile();



