import TSNE from 'tsne-js';
const fs = require('fs');  

let model = new TSNE({
  dim: 3,
  perplexity: 30.0,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 600,
  metric: 'euclidean'
});

var inputData = require("./data/wordVectors.json");

// inputData is a nested array which can be converted into an ndarray
// alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')

/*

model.init({
  data: inputData,
  type: 'dense'
});
//*/

model.on('progressIter', function (iter) {
	console.log("ITERATION: " + iter);
});

console.log("INITING.");

var num = 8000;

model.init({
  data: inputData.data.slice(0,num),
  type: 'dense'
});

// `error`,  `iter`: final error and iteration number
// note: computation-heavy action happens here
console.log("RUNNING.");
let [error, iter] = model.run();

console.log("OUTPUTTING.");
let outputScaled = model.getOutputScaled();

var out = [];
for (var i = 0; i < outputScaled.length; i++) {
	out[i] = {
		"pos":outputScaled[i],
		"label":inputData.labels[i]
	}
}

var json = JSON.stringify(out, null, 2);
//Write
console.log("WRITING.");
fs.writeFile("wordMap.json", json, 'utf8', function() {
console.log("Saved t-SNE JSON.");
});