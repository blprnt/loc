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

var dataPath = '/Users/jerthorp/Desktop/LOC_Residency/MARC_Files/Books/'

const marc_location = process.env.DATA_DIR || dataPath;

var screening = false;
var docCount = 0;
var docCounts = [];
var callNumCounts = [];

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
marcDict["050"] = {"a" :"CallNumber"};

var nameDict = {};
var lastNameDict = {};
var callDict = {};
var callYearTotals = [];


var allRecords = [];
 function parseRecord(obj) {
 	record = {};
 	//console.log("");
	//console.log("-------");
	for (var i = 0; i < obj.datafield.length; i++) {
		var df = obj.datafield[i];
		//Get the numeric tag
		var tag  = df.tag;

		//Get the accession #
		//if (tag == "005") 

	    //console.log(df);
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

	if (record.CallNumber) {
		var cn = record.CallNumber.substring(0,2);
		if (cn.indexOf("}") == -1) {
			incrementDict(callDict, cn, 1);
			if (record.Year > 1550 && record.Year < 2018) {
				   	var y = Math.floor((record.Year - 1550) / 1);
				   	if (!callYearTotals[y]) callYearTotals[y] = 0;
				   	callYearTotals[y] ++;
			}
		}
	}

	if (record.Year) {
		record.Year = record.Year.replace(/[c.,\/#!$%\^&\*\[\];:{}=\-_`~()]/g,"");
		record.Year = record.Year.substring(0,4);
	}
	if (record.Title) {
		docCount++;
		allRecords.push(record);
		if (screening) {
			box.setContent('{center}Processed {red-fg}' + allRecords.length + '{/red-fg} records.{/center}');
		}
		//screen.render();
	}

	if (record.Name) {	
		//console.log(record.Name);
		var firstName;
		var lastName;

		if (record.Name.split(", ")[1]) {
			firstName = record.Name.split(", ")[1].replace(",", "");
			lastName = record.Name.split(", ")[0];
	    } else {
	    	firstName = record.Name.replace(",", "");
	    	lastName = "None";
	    }

	    //Is it a double name?
	    if (firstName.split(" ").length > 1) {
	    	firstName = firstName.split(" ")[0];
	    }

	    //Increment first name counter
	    if (firstName.length > 2) {
		    incrementDict(nameDict, firstName, 5);
		}

		//Increment last name counter
		if (lastName) {
			incrementDict(lastNameDict, lastName,);
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


		   	//Five year intervals starting in 1550
		   
		   	if (record.Year > 1550 && record.Year < 2018) {
			   	var y = Math.floor((record.Year - 1550) / yi);
			   	
			   	if (!docCounts[y]) docCounts[y] = 0;
			   	docCounts[y] ++;

				dict[val].total ++;
				if (!dict[val].years[y]) dict[val].years[y] = 0;
				dict[val].years[y] ++;

				//Second level call number
				if (record.CallNumber) {
					var cn = record.CallNumber.substring(0,2);
					if (!callNumCounts[cn]) callNumCounts[cn] = 0;
				   	callNumCounts[cn] ++;

				   	if (!dict[val].callNums[cn]) dict[val].callNums[cn] = 0;
					dict[val].callNums[cn] ++;
				}
				
			}

			
} 

//Name counting
function reportNameCounts(dict, name) {
	// Create items array
	var outs = [];
	var items = Object.keys(dict).map(function(key) {
	    return [key, dict[key]];
	});

	// Sort the array based on the second element
	items.sort(function(first, second) {
	    return second[1].total - first[1].total;
	});

	// Create a new array with only the first 4000 items
	//Calculate new totals based on this subset of 4000
	var totals = [];
	var callTotals = {};
	for (var i = 0; i < 4000; i++) {
		outs.push(items[i]);
		for (var j = 0; j < items[i][1].years.length; j++) {
			if (!totals[j]) totals[j] = 0;
			if (items[i][1].years[j]) totals[j] += items[i][1].years[j];
		}
		for (var n in callNumCounts) {
			if (!callTotals[n]) callTotals[n] = 0;
			if (items[i][1].callNums[n]) callTotals[n] += items[i][1].callNums[n];
		}
	}	

	//Output JSON
	var json = JSON.stringify(outs, null, 2);
	//Write
	fs.writeFile(name + '.json', json, 'utf8', function() {
		console.log("Saved JSON.");
	});

	var tjson = JSON.stringify(totals, null, 2);
	//Write
	fs.writeFile(name + 'totals.json', tjson, 'utf8', function() {
		console.log("Saved totals JSON.");
	});

	/*
	var cnjson = JSON.stringify(callTotals, null, 2);
	//Write
	fs.writeFile(name + 'calltotals.json', cnjson, 'utf8', function() {
		console.log("Saved call totals JSON.");
	});
	*/

	var cjson = JSON.stringify(callDict, null, 2);
	//Write
	fs.writeFile('calls.json', cjson, 'utf8', function() {
		console.log("Saved call # JSON.");
	});

	var ctjson = JSON.stringify(callYearTotals, null, 2);
	//Write
	fs.writeFile('callYearTotals.json', ctjson, 'utf8', function() {
		console.log("Saved call # JSON.");
	});

}

function onParseFinished() {
	reportNameCounts(nameDict, "names");
	reportNameCounts(lastNameDict, "lastNames");
	console.log("TOTAL DOCS: " + docCount);
	console.log(docCounts);
	nextFile();
}


var counter = 1;

function nextFile() {
  var n = (counter < 10 ? "0":"") + counter;
  var url = marc_location + "/BooksAll.2014.part" + n + ".xml.gz";
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



