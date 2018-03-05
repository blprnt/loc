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

/*
const filePrefix = "BooksAll";
const section = "PS";
const fileCount = 41;
//*/

//*
const filePrefix = "Maps";
const fileCount = 1;
const section = "all";
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

marcDict["300"] = {"*" :"Materials"};

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

		var codeCheck = false;
			if (record.CallNumber && record.CallNumber[0]) {
				var cn = record.CallNumber[0].substring(0,2);
				if (cn.indexOf("}") == -1) {	
					if (cn == section || section == "all") codeCheck = true;
				}
			}

		if (record.Title.length > 0 && codeCheck) {
			var t = record.Title[0];
			var chk = checkForWords(t);
			if (chk.chk) {
				console.log(chk.word + ":" + record.Title + ":" + record.Year + ":" + record.Materials);
				wordMap[chk.word].push({
					"Title":record.Title,
					"Name":record.Name,
					"Year":record.Year,
					"Materials":record.Materials
				})

			}
		}
	}
	
}


var words = ["the end", "the beginning", "the start", "the finish"];
var wordMap = [];
for (var i = 0; i < words.length; i++) {
	wordMap[words[i]] = [];
}

function checkForWords(_s) {
	var chk = {chk:false, word:null};
	for (var i = 0; i < words.length; i++) {
		if (_s.toLowerCase().indexOf(words[i]) != -1) {
			chk.chk = true;
			chk.word = words[i];
		}
	}
	return(chk);
}

function writeWords() {
	for (var i = 0; i < words.length; i++) {
		var w = words[i];
		var a = wordMap[w];
		a.sort(function(a,b) {
			return(a.Title[0].length - b.Title[0].length);
		}) 
		var json = JSON.stringify(a, null, 2);
		//Write
		console.log("WRITING." + w);
		fs.writeFile(dataPath + "/words" + filePrefix + "_" + w + ".json", json, 'utf8', function() {
			console.log("Saved word JSON.");
		});
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
	
	writeWords();
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



