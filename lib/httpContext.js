var nodeUrl = require('url');
var nodeQuerystring = require('querystring');

var statusPhrases = require('./statusPhrases').statusPhrases;

var parseVirtualHost = function(request) {
	var host;
	if(request.headers.host) {
		host = 'http://' + request.headers.host;
	} else {
		return '';
	}
	
	var parsedHost = nodeUrl.parse(host);
	
	var virtualHost = {
		name: parsedHost.hostname,
		port: request.socket.server.address().port //localport
	};
	
	return virtualHost;
};

/*
 * Wrapper for request and response
 */
var HttpContext = function(server, url, req, res){
	this.server = server;
	this.request = req;
	this.response = res;
	this.headers = {};
	this.statusCode = 200;
	this.statusPhrase = 'OK';
	this.url = url;
	
	var parsedUrl = nodeUrl.parse(this.url);
	
	this.location =  parsedUrl.pathname;
	if(parsedUrl.query) {
		this.query = nodeQuerystring.parse(parsedUrl.query);
	} else {
		this.query = {};
	}
	
	var vh = parseVirtualHost(req);
	this.virtualHost = vh.name + ':' + vh.port;
	this.virtualHostName = vh.name + (vh.port == 80 ? '' : (':' + vh.port));
	this.virtualHostPort = vh.port;
	this.remoteAddress = this.request.socket.remoteAddress;
	this.remotePort = this.request.socket.remotePort;
	
	this.config = {};
};

HttpContext.prototype = {
	writeHeaders: function(code, phrase) {
		if(code) {
			this.statusCode = code;
			if(!phrase) {
				phrase = statusPhrases[code];
			}
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
	},
	dispatchUrl: function(url, callback) {
		this.server.dispatchUrl(url, this.request, this.response, callback);
	}
};

exports.HttpContext = HttpContext;