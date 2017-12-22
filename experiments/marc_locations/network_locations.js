/*

Node.js parser for MARC Files from Library of Congress
- Extract and visualize location data from JSON files for consumption by sigma.js
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
var dataPath = appRoot + "/data";

const marc_location = dataPath;

var docCount = 0;
var docCounts = [];
var callNumCounts = [];

var networkMap = {};

var totalCount = 0;

//Set up geocoder
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: 'YOUR API KEY GOES HERE.'
};
 
var geocoder = NodeGeocoder(options);


//XML Parser
var parser;
var parsing = false;
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
	    parsing = false;
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
marcDict["100"] = {"a" :"Name"};

var people = [];
var placeMap = [];
var allPlaces = [];

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


	//For now, we're only interested in records that have both birth and death place.
	if (record.BirthPlace && record.DeathPlace && record.BirthDate && record.DeathDate) {
		//Check if we have the locations geotagged already

		var bp;
		var dp;

		if (!placeMap[record.BirthPlace[0]]) {
			//Get a place record
			bp = {"births":1, "deaths":0};
			doGeoTag(record.BirthPlace[0], bp);
			placeMap[record.BirthPlace[0]] = bp;
			allPlaces.push(bp);
		} else {
			bp = placeMap[record.BirthPlace[0]];
			bp.births ++;
		}
		

		if (!placeMap[record.DeathPlace[0]]) {
			//Get a place record
			dp = {"deaths":1, "births":0};
			doGeoTag(record.DeathPlace[0], dp);
			placeMap[record.DeathPlace[0]] = dp;
			allPlaces.push(dp);
		} else {
			dp = placeMap[record.DeathPlace[0]];
			dp.deaths ++;
		}

		//Make a person record
		var person = {
			"name":record.Name[0],
		    "birthPlace":bp,
		    "deathPlace":dp,
		    "birthDate":record.BirthDate[0],
		    "deathDate":record.DeathDate[0]
		     };

		 people.push(person);

	}
	
}

geoQ = [];
var first = true;
var gc = 0;

function doGeoTag(placeString, placeObject) {
		//console.log("ADD TO Q:" + placeString);
		geoQ.push({"placeString":placeString, "placeObject":placeObject});
		if(first && geoQ.length > 20) {
			nextGeo();
			first = false;
		}
}

function nextGeo() {
	processGeoTag(geoQ[0].placeString);
}

function geoDone(geoReturn) {
	geoQ[0].placeObject.geoReturn = geoReturn[0];
	if(geoQ.length > 0) {
		geoQ.shift();
	    if (geoQ.length > 0) {
			nextGeo();
		}
	}
	gc ++;
	if (!parsing && geoQ.length == 0) {
		console.log("ALL DONE, AT LAST");
		sortAndWritePeople();
	}
}

function processGeoTag(placeString) {
	console.log(geoQ.length + " - ATTEMPT GEO ON:" + placeString);
	// Using callback
	var p = geocoder.geocode(placeString);


	  p.then(function(res) {
	    console.log("SUCCESS");
	    geoDone(res);
	  })
	  .catch(function(err) {
	    console.log("ERROR GEOCODING");
	    console.log(err);
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
	sortAndWritePeople();
	console.log('************************' + totalCount)
	if (counter < 38) nextFile();
}

function sortAndWritePeople() {
	//Replace object entries in people w/ Google place IDs
	var newPeople = [];
	for (var i = 0; i < people.length; i++) {
		var p = people[i];
		var np = {};
		np.name = p.name;
		np.birthDate = p.birthDate;
		np.deathDate = p.deathDate;
		if (p.birthPlace.geoReturn) {
			np.birthPlaceID = p.birthPlace.geoReturn.extra.googlePlaceId;
			np.deathPlaceID = p.birthPlace.geoReturn.extra.googlePlaceId;
		}
		newPeople.push(np);
	}

	//Go through places and combine those with the same GoogleID
	var gMap = {};
	var newPlaces = [];
	for (var i = 0; i < allPlaces.length; i++) {
		var p = allPlaces[i];
		if (p.geoReturn) {
			var gId = p.geoReturn.extra.googlePlaceId;
			if (!gMap[gId]) {
				p.name = p.geoReturn.city;
				p.id = gId;
				newPlaces.push(p);
			} else {
				var canonPlace = gMap[gId];
				canonPlace.births += p.births;
				canonPlace.deaths += p.deaths;
			}
		}
	}
	//Replace array with new de-duplicated one
	//allPlaces = newPlaces;

	//Sort arrays
	newPlaces.sort(function(a, b){return (b.births - b.deaths) - (a.births - a.deaths)});
	/*
	people.sort(function(a, b){
		return parseInt(b.meanDist) - parseInt(a.meanDist)
	});
    */

	//Write files
	var jsonPeople = JSON.stringify(newPeople, null, 2);
	var jsonPlaces = JSON.stringify(newPlaces, null, 2);

	//Write
	fs.writeFile(appRoot + '/data/places.json', jsonPlaces, 'utf8', function() {
		console.log("Saved places JSON.");
	});

	fs.writeFile(appRoot + '/data/people.json', jsonPeople, 'utf8', function() {
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

	console.log("LOADING FILE : " + url);
	counter ++;
	if (counter < 39) {
		parsing = true;
		rstream   // reads from myfile.txt.gz
		  .pipe(gunzip)  // uncompresses
		  .pipe(parser.saxStream); //Parses into record objects
	} 


}

loadNetworkDistances();
nextFile();

setInterval(function(){ console.log("Hello"); }, 30000);



