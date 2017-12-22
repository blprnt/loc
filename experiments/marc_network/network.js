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
marcDict["370"] = {"a" :"BirthPlace", "b": "DeathPlace", "e": "ResidencePlace", "f":"OtherPlace"};
marcDict["046"] = {"f" :"BirthDate", "g":"DeathDate"};
marcDict["374"] = {"a" :"Occupation"};

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

	if (record.Occupation) {
		if (record.Occupation.length > 0) {
			var stemmed = [];
			//Stem the occupation (ie writers -> writer) to reduce duplicates
			for (var i = 0; i < record.Occupation.length; i++) {
				var stem = natural.PorterStemmer.stem(record.Occupation[i]);
				//console.log(record.Occupation[i] + ":" + stem)
				stemmed.push(stem);
			}

			fileNetworkEntry("Occupation", stemmed);
	 	}
	}

	if (record.BirthPlace && record.DeathPlace) {
		fileNetworkEntry("Places", [record.BirthPlace[0], record.DeathPlace[0]]);
		//console.log(record.BirthPlace + ":" +  record.DeathPlace);
	}
	
}

function fileNetworkEntry(networkKey, entryArray) {
	//Does the key exist? If not create a new network object
	if (!networkMap[networkKey]) {
		networkMap[networkKey] = {"network":{"nodes":[], "edges":[]}, "maps":{"nodes":{}}};
	}
	var network = networkMap[networkKey];

	//Make a node object for each item in the entryArray
	/*

	{
      "id": "n0",
      "label": "A node",
      "x": 0,
      "y": 0,
      "size": 3
    }

    */
	for (var i = 0; i < entryArray.length; i++) {
		var nodeName = entryArray[i];
		if (!network.maps.nodes[nodeName]) {
			var n = {
				"id":"n" + network.network.nodes.length,
				"label": nodeName,
				"x": Math.random() * 100,
				"y": Math.random() * 100,
				"size":1
			};
			network.maps.nodes[nodeName] = n;
			network.network.nodes.push(n);
		}

		network.maps.nodes[nodeName].size ++;
	}

	//Make edge objects
	/*

	 {
      "id": "e0",
      "source": "n0",
      "target": "n1"
    }

    */

	for (var i = 0; i < entryArray.length; i++) {
		var nodeName = entryArray[i];
		var n1 = network.maps.nodes[nodeName];
		for (var j = i + 1; j < entryArray.length; j++) {
			if (i != j) {
				var nodeName2 = entryArray[j];
				var n2 = network.maps.nodes[nodeName2];
				var e = {
					"id": "e" + network.network.edges.length,
					"source": n1.id,
					"target": n2.id
				};
				network.network.edges.push(e);

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
	
	console.log("TOTAL OCCS:" + networkMap["Occupation"].network.nodes.length);
	console.log("TOTAL PLACES:" + networkMap["Places"].network.nodes.length);
	saveNetwork("Occupation");
	saveNetwork("Places");
	nextFile();
}

function saveNetwork(name) {
	var network = networkMap[name];
	var json = JSON.stringify({"nodes":network.network.nodes, "edges":network.network.edges}, null, 2);
	//Write
	fs.writeFile(name + '_network.json', json, 'utf8', function() {
		console.log("Saved " + name + " JSON.");
	});
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

nextFile();



