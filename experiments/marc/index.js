/*

Node.js parser for MARC Files from Library of Congress
Jer Thorp (@blprnt)
September, 2017

*/

let request = require('request');
const fs = require('fs');  
const zlib = require('zlib');
const concat = require('concat-stream');
const xml2object = require('xml2object');
var blessed = require('blessed');

const marc_location = "/Users/jerthorp/Desktop/LOC_Residency/MARC_Files";

var screening = false;

if (screening) {

// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
});

screen.title = 'my window title';

// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Hello {bold}world{/bold}!',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(box);

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus our element.
box.focus();

// Render the screen.
screen.render();
}


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
marcDict["260"] = {"c" :"Year"};
marcDict["100"] = {"a" :"Name"};

var nameDict = {};

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
					record[marcDict[tag][code]] = disp;
				}
			}
		}
	}
	if (record.Title) {
		allRecords.push(record);
		if (screening) {
			box.setContent('{center}Processed {red-fg}' + allRecords.length + '{/red-fg} records.{/center}');
		}
		//screen.render();
	}

	if (record.Name) {	
		//console.log(record.Name);
		var firstName;
		if (record.Name.split(", ")[1]) {
			firstName = record.Name.split(", ")[1].replace(",", "");
	    } else {
	    	firstName = record.Name.replace(",", "")
	    }

	    //Increment name counter
	    if (!nameDict[firstName]) nameDict[firstName] = 0;
		nameDict[firstName] ++;
	}
	
}

//Name counting
function reportNameCounts() {
	// Create items array
	var items = Object.keys(nameDict).map(function(key) {
	    return [key, nameDict[key]];
	});

	// Sort the array based on the second element
	items.sort(function(first, second) {
	    return second[1] - first[1];
	});

	// Create a new array with only the first 5 items
	console.log(items.slice(0, 5));

}

function onParseFinished() {
	reportNameCounts();
	nextFile();
}

var gunzip = zlib.createGunzip();
var counter = 1;

function nextFile() {
	var n = (counter < 10 ? "0":"") + counter;
	var url = marc_location + "/Books/BooksAll.2014.part" + n + ".xml.gz";
	var rstream = fs.createReadStream(url);
	makeParser();

	console.log("LOADING FILE : " + url);
	counter ++;
	if (counter < 10) {
		rstream   // reads from myfile.txt.gz
		  .pipe(gunzip)  // uncompresses
		  .pipe(parser.saxStream); //Parses into record objects
	}


}

nextFile();



