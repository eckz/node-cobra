var nodeHttp = require('http');
var nodeUrl = require('url');
var nodeUtil = require('util');
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

var HttpServer = function(){
	HttpServer.super_.call(this);
	this.config = {};
};

exports.HttpServer = HttpServer;

nodeUtil.inherits(HttpServer, require('./modulesContainer').ModulesContainer);

var proto = HttpServer.prototype;

proto.defaultHeaders = {
	'Content-Type': 'text/html; charset=utf-8',
	'Server': 'node-cobra (Powered By node.JS [Powered by V8])'
};

proto.listenOn = function() {
	var server = nodeHttp.createServer(this.dispatch.bind(this));
	server.listen.apply(server, arguments);
	
	console.log('Listening on', arguments[0]);
};

proto.addConfig = function(c) {
	this.config.extend(c);
},

proto.dispatch = function(req, res) {
	var context = new HttpContext(this,req,res);
	
	context.addConfig(this.config);
	
	context.addHeaders(this.defaultHeaders);
	context.addHeaders({'Date': new Date().toUTCString()});
	
	this.triggerHook('request', [context], function(result) {
		if(result === 'undispatched') {
			this._error(context, 505, 'Undispatched request');
		}
	}.bind(this));
	
};

proto._error = function(context, code, msg, extra, showConfig) {
	context.statusCode = code;
	context.statusPhrase = msg;
	context.statusExtra = extra;
	
	context.writeHeaders();
	
	console.error('ERROR', code, msg);
	
	this.emit('httpError', context);
	
	/* rendering the error */
	
	var title = '' + code + ' ' + msg;
	var w = context.write.bind(context);
	
	w('<html><head><title>'); w(title); w('</title></head>');
	w('<body><h1>'); w(title); w('</h1>');
	
	if(extra) {
		w('<p>'); w(extra); w('</p>');
	}
	
	if(showConfig) {
		w('<p><h3>Configuration:</h3><code>');
		w(JSON.stringify(context.config));
		w('</code></p>');
	}
	
	w('</body></html>');
	
	context.end();
};
