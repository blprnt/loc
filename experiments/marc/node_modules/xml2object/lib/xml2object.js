/**
 * Simple xml 2 javascript object parser based on sax.js
 *
 * https://github.com/emberfeather/node-xml2object
 */
var emitter = require('events').EventEmitter;
var fs = require('fs');
var sax = require('sax');
var Stream = require('stream');
var util = require('util');

var xml2object = module.exports = function(elements, source, saxOptions) {
	elements = elements || [];
	saxOptions = saxOptions || {};

	this._hasStarted = false;

	var self = this;
	var currentObject;
	var inObject = false;
	var inObjectName;
	var ancestors = [];

	// Define the inputStream property.
	Object.defineProperty(self, 'source', {
		get: function () {
			return self.inputStream;
		},
		set: function (val) {
			if(val instanceof Stream) {
				if(!val.readable) {
					throw new Error('Source stream is not readable');
				}

				// Allowing for passing in a readable stream.
				self.inputStream = val;
			} else if(typeof val === 'string') {
				// Allow for passing a filename.
				self.inputStream = fs.createReadStream(val);
			}
		}
	});

	this.source = source;
	this.saxStream = sax.createStream(true, saxOptions);

	var openTag = function(args) {
		// if xmlns option set use the local tag name rather than full name.
		var tagName = saxOptions.xmlns ? args.local : args.name;

		if(!inObject) {
			// If we are not in an object and not tracking the element
			// then we don't need to do anything.
			if (elements.indexOf(tagName) < 0) {
				return;
			}

			// Start tracking a new object.
			inObject = true;
			inObjectName = tagName;

			currentObject = {};
		}

		if (!(tagName in currentObject)) {
			currentObject[tagName] = args.attributes;
		} else if (!util.isArray(currentObject[tagName])) {
			// Put the existing object in an array.
			var newArray = [currentObject[tagName]];

			// Add the new object to the array.
			newArray.push(args.attributes);

			// Point to the new array.
			currentObject[tagName] = newArray;
		} else {
			// An array already exists, push the attributes on to it.
			currentObject[tagName].push(args.attributes);
		}

		// Store the current (old) parent.
		ancestors.push(currentObject);

		// We are now working with this object, so it becomes the current parent.
		if (currentObject[tagName] instanceof Array) {
			// If it is an array, get the last element of the array.
			currentObject = currentObject[tagName][currentObject[tagName].length - 1];
		} else {
			// Otherwise, use the object itself.
			currentObject = currentObject[tagName];
		}
	};

	var closeTag = function (name) {
		// `name` is namespace prefixed always.
		// Strip the ns off if xmlns option was set.
		name = saxOptions.xmlns ? name.replace(/.+?:/,'') : name;

		if(!inObject) {
			return;
		}

		if(inObject && inObjectName === name) {
			// Finished building the object.
			self.emit('object', name, currentObject);

			inObject = false;
			ancestors = [];

			return;
		}

		if(ancestors.length) {
			var ancestor = ancestors.pop();
			var keys = Object.keys(currentObject);

			if (keys.length == 1 && '$t' in currentObject) {
				// Convert the text only objects into just the text.
				if (ancestor[name] instanceof Array) {
					ancestor[name].push(ancestor[name].pop()['$t']);
				} else {
					ancestor[name] = currentObject['$t'];
				}
			} else if (!keys.length) {
				// Remove empty keys.
				delete ancestor[name];
			}

			currentObject = ancestor;
		} else {
			currentObject = {};
		}
	};

	var text = function (data) {
		if(!inObject) {
			return;
		}

		data = data.trim();

		if (!data.length) {
			return;
		}

		currentObject['$t'] = (currentObject['$t'] || "") + data;
	}

	this.saxStream.on("opentag", openTag);
	this.saxStream.on("opencdata", function(args) {
		openTag({
			name: "$d",
			attributes: {}
		});
	});

	this.saxStream.on("text", text);
	this.saxStream.on("cdata", text);

	this.saxStream.on("closetag", closeTag);
	this.saxStream.on("closecdata", function(name) {
		closeTag("$d");
	});

	// Rebroadcast the error and keep going
	this.saxStream.on("error", function (e) {
		self.emit('error', e);

		// clear the error and resume
		this._parser.error = null;
		this._parser.resume();
	});

	// Rebroadcast the end of the file read
	this.saxStream.on("end", function() {
		self.emit("end");
	});
};

util.inherits(xml2object, emitter);

xml2object.prototype.start = function() {
	// Can only start once
	if(this._hasStarted) {
		return;
	}

	// Must have a stream to start
	if(!this.inputStream) {
		throw new Error('Missing parsing source');
	}

	this._hasStarted = true;

	this.emit('start');

	// Start the streaming!
	this.inputStream.pipe(this.saxStream);
}
