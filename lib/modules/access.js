var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'Access';

var checkPermission = function(label)

var checkPermissions = function(client, access, def) {

	console.log('access', access);
	var result = def;
	access.some(function(a) {
		var allow = a.allow;
		var deny = a.deny;
		
		console.log('allow', allow);
		console.log('deny', deny);
		
		if(deny == 'all') {
			result = false;
			return;
		}
		if(allow == 'all') {
			result = true;
			return;
		}
		if(allow == client) {
			result = true;
			return;
		}
		if(deny == client) {
			result = false;
			return;
		}

	});
	
	console.log('result', result);
	return result;
};

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
		if(value.forEach) {
			value.forEach(function(v) {
				var a = {};
				a[accessKey] = v;
				c.access.push(a);
			});
		}
	};
};

var request = function(context) {
	var client = context.remoteAddress;
	var access = context.config.access;
	
	access = access || [];
	
	if(!checkPermissions(client, access, true)) {
		context.error(403, 'The file is forbidden because of the location config');
		return true;
	}
	
	/* Clean permissions */
	delete context.config.access;
	
	return false;
};

var requestFile = function(context) {
	var client = context.remoteAddress;
	var access = context.config.access;
	
	access = access || [];
	
	if(!checkPermissions(client, access, false)) {
		context.error(403, 'The file is forbidden because of the directory config');
		return true
	}
	
	return false;
};
