var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'access';

exports.init = function(server) {
	server.addHook('request', -900, request);
	server.addHook('requestFile', -900, requestFile);
	
	var confModule = server.getModule('config');
	if(confModule) {
		confModule.addPropertyHandler('allow', handleAccess('allow'));
		confModule.addPropertyHandler('deny', handleAccess('deny'));
	}
};

var handleAccess = function(accessKey) {
	return function(scope, context, value) {
		var c = context.config;
		if(c.access === undefined) {
			c.access = [];
		}
		if(typeof(value) !== "array") {
			value = [value];
		}

		value.forEach(function(v) {
			var a = {};
			a[accessKey] = v;
			c.access.push(a);
		});
	};
};

var _checkMatch = function(client, value) {
	if(value === undefined) {
		return false;
	}
	if(value == 'all') {
		return true;
	}
	if(value === client) {
		return true;
	}
	return false;
}

var _checkPermissions = function(client, access, def) {
	var result = def;
	access.some(function(a) {
		if(_checkMatch(client, a.deny)) {
			result = false;
			return true;
		}
		if(_checkMatch(client, a.allow)) {
			result = true;
			return true;
		}
	});
	
	return result;
};

var request = function(context) {
	var client = context.remoteAddress;
	var access = context.config.access;
	
	if(access && !_checkPermissions(client, access, true)) {
		context.error(403, 'The location ' + context.location +' is forbidden');
		return true;
	}
	
	/* Clean permissions */
	delete context.config.access;
	
	return false;
};

var requestFile = function(context) {
	var client = context.remoteAddress;
	var access = context.config.access;
	
	if(!access || !_checkPermissions(client, access, false)) {
		context.error(403, 'The path ' + context.path + ' is forbidden');
		return true;
	}
	
	return false;
};
