var nodeHttp = require('http');
var nodeUrl = require('url');
var nodeUtil = require('util');

/*
 * Wrapper for request and response
 */
var HttpContext = function(server, req, res){
	this.server = server;
	this.request = req;
	this.response = res;
	this.headers = {};
	this.statusCode = 200;
	this.statusPhrase = '';
	this.url = req.url;
	
	this.config = {};
};

HttpContext.prototype = {
	writeHeaders: function() {
		this.response.writeHead(this.statusCode, this.statusPhrase, this.headers);
	},
	addHeaders: function(h) {
		this.headers.extend(h);
	},
	removeHeader: function(h) {
		delete this.headers[h];
	},
	write: function() {
		this.response.write.apply(this.response, arguments);
	},
	end: function() {
		this.response.end.apply(this.response, arguments);
	}
}

var ModuleDispatcher = function(modules){
	this.modules = [];
	this.modules.push.apply(this.modules, modules);
};

ModuleDispatcher.prototype.dispatch = function(method, args, callback) {
	this.method = method;
	this.args = args;
	this.callback = callback;
	this.result = 'undispatched';
	
	this.dispatchNext();
};

ModuleDispatcher.prototype.dispatchNext = function() {
	if(this.modules.length == 0) {
		this.finishDispatch();
	}
	var module = this.modules.shift();
	var result = null;
	var callable = module[this.method];
	
	if(typeof(callable) === 'function') {
		
		console.log('executing',this.method,'in',module.name,'module');
		
		var res = callable.apply(this, this.args);
		
		this.result = 'res';
	}
	
	if(this.result != 'undispatched') {
		this.finishDispatch();
	}
};

ModuleDispatcher.prototype.finishDispatch = function() {
	this.callback.call(null, this.result);
}

var HttpServer = function(){};

exports.HttpServer = HttpServer;

nodeUtil.inherits(HttpServer, require('events').EventEmitter);

var proto = HttpServer.prototype;

proto.contructor = function(config) {
	HttpServer.super_.call(this);
	
	this._runModules('init', this);
}

proto._modules = [];
proto._modulesMap = [];

proto.addModule = function(mod, priority) {
	if(priority === undefined) {
		priority = 0;
	}
	this._modulesMap.push({module:mod, priority: priority});
	this._reorderModules();
}

proto._reorderModules = function() {
	this._modulesMap.sort(function(a,b) {
		a = a.priority;
		b = b.priority;
		return a - b;
	});
	this._modules = this._modulesMap.map(function(m) { return m.module; });
}

proto._runModules = function() {
	var args = [];
	args.push.apply(args, arguments);
	
	var method = args.shift();
	
	var result = 'undispatched';
	
	this._modules.forEach(function(mod) {
		var m = mod[method];
		
		if(typeof(m) === 'function') {
			
			console.log('executing',method,'in',mod.name,'module');
			
			var res = m.apply(mod, args);
			
			if(res === 'dispatched') {
				// break the loop
				result = 'dispatched';
				return false;
			}
		}
	});
	return result;
}

proto.__defineSetter__('documentRoot', function(v) {
	v = path.resolve(v);
	this._documentRoot = v + '/';
	console.log('DocumentRoot:', this._documentRoot);
});

proto.defaultHeaders = {
	'Content-Type': 'text/html; charset=utf-8',
	'Server': 'ObrienEngine (Powered By node.JS [Powered by V8])'
};

proto.listenOn = function() {
	var server = nodeHttp.createServer(this.dispatch.bind(this));
	server.listen.apply(server, arguments);
	
	console.log('Listening on', arguments[0]);
};

proto.dispatch = function(req, res) {
	var context = new HttpContext(this,req,res);
	
	context.addHeaders(this.defaultHeaders);
	context.addHeaders({'Date': new Date().toUTCString()});
	
	var dispatcher = new ModuleDispatcher(this._modules);
	
	dispatcher.dispatch('request', [context], function(result) {
		if(result === 'undispatched') {
			this._error(context, 505, 'Undispatched request');
		}
	});
	
};

proto._error = function(context, code, msg, extra) {
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
	
	w('</body></html>');
	
	context.end();
};
