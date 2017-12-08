//Load names, last names, year totals, call number section totals
var names = require("./names.json");
var lastNames = require("./lastNames.json");

var firstTotals = require("./namestotals.json");
var lastTotals = require("./lastNamestotals.json");

var firstCallNumTotals = require("./namescalltotals.json");
var lastCallNumTotals = require("./lastNamescalltotals.json");

var codes = require("./codes.json");


function getNames(section, num) {
	var firsts = [];
	var lasts = [];

	//Calculate a TFIDF value for every first name in our list
	for (var i = 0; i < names.length; i++) {
		//Term frequency is the freq of the term within a document (here, a section)
		var tf = names[i][1].callNums[section] / firstCallNumTotals[section];

		//Document frequency is the freq of the term across all documents
		var idf = Math.log(getSum(firstTotals) / getSum(names[i][1].years) );
	
		var v = (tf) ? tf * idf : 0;
		names[i].tfidf = v;
	}


	//Sort the array on the tfidf
	names.sort(function(a,b) {return(b.tfidf - a.tfidf)});

	//Spit out the tops
	for (var i = 0; i < num; i++) {
		firsts.push(names[i][0]);
	}

	//Do the same for last names
	for (var i = 0; i < lastNames.length; i++) {
		//Term frequency is the freq of the term within a document (here, a section)
		var tf = lastNames[i][1].callNums[section] / lastCallNumTotals[section];

		//Document frequency is the freq of the term across all documents
		var idf = Math.log(getSum(lastTotals) / getSum(lastNames[i][1].years) );
	
		var v = (tf) ? tf * idf : 0;
		lastNames[i].tfidf = v;
	}


	//Sort the array on the tfidf
	lastNames.sort(function(a,b) {return(b.tfidf - a.tfidf)});

	//Spit out the tops
	for (var i = 0; i < num; i++) {
		lasts.push(lastNames[i][0]);
	}

	return({"firsts":firsts, "lasts":lasts});

	

}

function getSum(a) {
 return(a.reduce(function(a,b){return a + b;}, 0));
}

function getAllEmNames() {
	for (var i = 0; i < codes.length; i++) {
		var n = getNames(codes[i].code, 2);
		console.log(codes[i].class + ": " + n.firsts[1] + " " + n.lasts[1]);
	}
}

getAllEmNames();



