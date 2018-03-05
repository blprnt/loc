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
const rita = require('rita');

var dataPath = appRoot + "/data";

const marc_location = dataPath;

//*
const filePrefix = "Visual.Materials";
const fileCount = 1;
const section = "all";
var justWords = false;
//*/

/*
const filePrefix = "BooksAll";
const section = "PS";
const fileCount = 41;
var justWords = true;
//*/



/*
const filePrefix = "Music";
const fileCount = 2;
const section = "all";
var justWords = true;
//*/

/*
const filePrefix = "Maps";
const fileCount = 1;
const section = "all";
var justWords = true;
//*/

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
marcDict["856"] = {"u" :"URL"};

var nameDict = {};
var lastNameDict = {};
var callDict = {};
var callYearTotals = [];

var numRecords = [];

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
			var t = record.Title.join(" ");
			console.log(t);
			var chk = checkForNumber(t);
			if (chk.chk) {
				if (chk.num > 10) console.log(chk.num + ":" + record.Title[0]);
				numRecords.push({title:t, numObject:chk, url:record.URL});
			}
		}
	}
	
}

function checkForNumber(_s) {
	var units = [
        "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen",
      ];

    var tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

    var scales = ["hundred", "thousand", "million", "billion", "trillion"]

    //Make the full number list

    var sixty = [];
    for (var i = 0; i < 60; i++) {
    	if (i < 20) {
    		sixty[i] = units[i];
    	} else {
    		if (i % 10 == 0) {
    			sixty[i] = tens[Math.floor(i/10)];
    		} else {
    			sixty[i] = tens[Math.floor(i/10)] + "-" + units[i % 10];
    		}
    	}

    }

    var words = rita.tokenize(_s);
    var chk = {chk:false, col:null};
    var dateChk = dateCheck(_s);

    for (var j = 0; j < words.length; j++) {
	
		for (var i = 0; i < sixty.length; i++) {
			if (words[j].toLowerCase() == sixty[i] || (words[j].toLowerCase() == i && !justWords)  && !dateChk) {
				chk.chk = true;
				chk.num = i;
				chk.numWord = words[j];
				chk.numIndex = j;
			}
		}
	}
	return(chk);
}

function dateCheck(_s) {
	var stops = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
				  "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
				  "Av.", "Ave", "St.", "Pl.", "B'way", "Broadway",
				  "no.", "No.", "part", "Part"];
	var chk = false;
	for (var i = 0; i < stops.length; i++) {
		if (_s.indexOf(stops[i]) != -1) chk = true;
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

function writeNumbers() {
	numRecords.sort(function(a,b) {
		return(a.numObject.num - b.numObject.num);
	})

	var json = JSON.stringify(numRecords, null, 2);

	fs.writeFile(dataPath + "/numbers" + filePrefix + "_" + section + ".json", json, 'utf8', function() {
		console.log("Saved number JSON.");
	});

}

function onParseFinished() {
	
	writeNumbers();
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



