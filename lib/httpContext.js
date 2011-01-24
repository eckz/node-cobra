var nodeUrl = require('url');
var nodeQuerystring = require('querystring');

/*
 * Wrapper for request and response
 */
var HttpContext = function(server, req, res){
	this.server = server;
	this.request = req;
	this.response = res;
	this.headers = {};
	this.statusCode = 200;
	this.statusPhrase = 'OK';
	this.url = req.url;
	
	var parsedUrl = nodeUrl.parse(this.url, true);
	
	this.location =  parsedUrl.pathname;
	if(parsedUrl.query) {
		this.query = nodeQuerystring.parse(parsedUrl.query);
	} else {
		this.query = {};
	}
	
	this.virtualHost = this.request.headers.host;
	this.remoteAddress = this.request.socket.remoteAddress;
	this.remotePort = this.request.socket.remotePort;
	
	this.config = {};
};

HttpContext.prototype = {
	writeHeaders: function(code, phrase) {
		if(code) {
			this.statusCode = code;
		}
		if(phrase) {
			this.statusPhrase = phrase;
		}
		this.response.writeHead(this.statusCode, this.statusPhrase, this.headers);
	},
	addHeaders: function(h) {
		this.headers.extend(h);
	},
	removeHeader: function(h) {
		delete this.headers[h];
	},
	addConfig: function(c) {
		this.config.extend(c);
	},
	write: function() {
		this.response.write.apply(this.response, arguments);
	},
	end: function() {
		this.response.end.apply(this.response, arguments);
	},
	error: function() {
		var args = [];
		args.push(this);
		args.push.apply(args, arguments);
		this.server._error.apply(this.server, args);
	}
};

exports.HttpContext = HttpContext;