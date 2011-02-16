
var HeadersParser = require('./HeadersParser.js').HeadersParser;

var CgiStream = function(context) {
	this.context = context;
	this.active = true;
	this.parser = new HeadersParser();
	
	this.headersParsed = false;
	this.errorBuffers = [];
	
	this.parser.on('data', parserData.bind(this));
	this.parser.on('headers', parserHeaders.bind(this));
};

var parserData = function(data) {
	if(!this.active) return;
	
	var c = this.context;
	c.write(data);
	if(this.errorBuffers !== null) {
		// stderr data
		this.errorBuffers.forEach(c.write.bind(c));
		this.errorBuffers = null;
	}
};

var parserHeaders = function(headers) {
	if(!this.active) return;
	
	var status = headers.Status;
	if(status) {
		delete headers.Status;
	}
	this.context.addHeaders(headers);
	if(status) {
		var s = status.split(' ', 2);
		this.context.writeHeaders(s[0], s[1]);
	} else {
		this.context.writeHeaders(200);
	}
	this.headersParsed = true;
};

CgiStream.prototype.write = function(data) {
	if(!this.active) return;
	
	this.parser.write(data);
};

CgiStream.prototype.writeError = function(data) {
	if(!this.active) return;
	
	if(!this.headersParsed) {
		this.errorBuffers.push(data);
	} else {
		context.write(data);
	}
};

CgiStream.prototype.end = function() {
	if(!this.active) return;
	
	var c = this.context;
	
	if(!this.headersParsed) {
		c.addHeaders({
			'Content-Type': 'text/html'
		});
		c.writeHeaders(500);
	}
	
	if(this.errorBuffers !== null) {
		this.errorBuffers.forEach(c.write.bind(c));
	}
	
	c.end();
	
	this.active = false;
};


CgiStream.prototype.stop = function() {
	this.active = false;
};

exports.CgiStream = CgiStream;
