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

var docCount = 0;
var docCounts = [];
var callNumCounts = [];

var networkMap = {};

var totalCount = 0;

//XML Parser
var parser;
// Create a new xml parser looking for the record objects
function makeParser() {
	parser = new xml2object([ 'record' ]);
	parser.outs = [];

	parser.on('object', function(name, obj) {
		parseRecord(obj);
		totalCount ++;
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
marcDict["374"] = {"a" :"Occupation"};
marcDict["100"] = {"a" :"Name"};

var allRecords = [];
var people = [];

 function parseRecord(obj) {
 	record = {};
	for (var i = 0; i < obj.datafield.length; i++) {
		var df = obj.datafield[i];
		//Get the numeric tag
		var tag  = df.tag;
		//If we have the tag in our dictionary, write to the JSON object
		//Based on the code (doesn't work for all cases?)
		if (marcDict[tag]) {
			if (!Array.isArray(df.subfield)) {
				df.subfield = [df.subfield];
			}
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

	if (record.Occupation && !record.Name) {
		console.log("---- NO NAME ------");
		console.log(obj.datafield);
	}

	if (record.Occupation) {
		if (record.Occupation.length > 2) {
			var totalDist = 0;
			for (var i = 1; i < record.Occupation.length; i++) {
				var o1 = occupationMap[natural.PorterStemmer.stem(record.Occupation[i - 1])];
				var o2 = occupationMap[natural.PorterStemmer.stem(record.Occupation[i])];

				if (o1 && o2) {
					var distX = o2.x - o1.x;
					var distY = o2.y - o1.y;
					var dist = Math.sqrt((distX * distX) + (distY + distY));
					totalDist += dist;
			    }
			}

			if (totalDist > 1000) {
				console.log(record.Name);
				console.log(record.Occupation);
				console.log(totalDist);
				people.push({"name":record.Name[0], "occupations":record.Occupation, "totalDist":totalDist, "meanDist":(totalDist / (record.Occupation.length - 1))});
			}
	 	}
	}
	
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
	sortAndWritePeople();
	console.log('************************' + totalCount)
	nextFile();
}

function sortAndWritePeople() {
	//Sort
	people.sort(function(a, b){return b.meanDist - a.meanDist});
	var json = JSON.stringify(people, null, 2);
	//Write
	fs.writeFile(appRoot + '/data/polymaths.json', json, 'utf8', function() {
		console.log("Saved people JSON.");
	});
}

var occupationMap = {};
function loadNetworkDistances() {
	var data = require(appRoot + "/data/occupation_coords.json");
	for (var i = 0; i < data.length; i++) {
		var o = data[i];
		occupationMap[o.label] = o;
	}
}


var counter = 1;

function nextFile() {
  var n = (counter < 10 ? "0":"") + counter;
  var url = marc_location + "/Names.2014.part" + n + ".xml.gz";
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

loadNetworkDistances();
nextFile();



