var nodeUtil = require('util');
var EventEmitter = require('events').EventEmitter;

var _parseHeaders = function(str) {
	
	var splitted = str.split('\r\n');
	var result = {};
	
	splitted.forEach(function(h) {
		h = h.split(':', 2);
		var key = h[0].trim(),
		    value = h[1].trim();
		
		if(result[key] === undefined) {
			result[key] = value;
		} else if(Array.isArray(result[key])){
			result[key].push(v);
		} else {
			result[key] = [result[key], value];
		}
	});
	
	return result;
};

var HeadersParser = function() {
	this.headersParsed = false;
	this.headersBuffer = new Buffer(4096);
	this.headersOffset = 0;
};

nodeUtil.inherits(HeadersParser, EventEmitter);

HeadersParser.prototype.write = function(data) {
	if(!this.headersParsed) {
		var c = data.copy(this.headersBuffer, this.headersOffset);
		if(c < data.length) {
			throw new Error('Index out of bounds');
		}
		this.headersOffset += c;
		
		var i = this.headersBuffer.indexOf([13,10,13,10], 0, this.headersOffset); // \r\n\r\n
		if(i >= 0) {
			var buffer = this.headersBuffer.slice(0, i);
			var headers = _parseHeaders(buffer.toString('ascii'));
			
			this.emit('headers', headers);
			
			if(this.headersOffset > (i + 4)) {
				this.emit('data', this.headersBuffer.slice(i + 4, this.headersOffset));
			}
			
			this.headersParsed = true;
			this.headersBuffer = null;
		}
	} else {
		this.emit('data', data);
	}
};

exports.HeadersParser = HeadersParser;
