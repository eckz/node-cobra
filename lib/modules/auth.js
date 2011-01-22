var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'File';
exports.priority = -50;


var checkPermissions = function(client, allow, deny, def) {
	if(deny === 'all') {
		/* Check allow */
		if(allow && client in allow) {
			return true;
		}
		return false;
	} else {
		/* First check deny, then allow */
		if(deny && client in deny) {
			return false;
		}
		if(allow && (allow === 'all' || client in allow)) {
			return true;
		}
	}
	return def;
};

exports.request = function(context) {
	var client = context.remoteAddress;
	var allow = context.config.allow;
	var deny = context.config.deny;
	
	if(!checkPermissions(client, allow, deny, true)) {
		context.error(403, 'Forbidden', 'The file is forbidden because of the location config');
		return true;
	}
	
	/* Clean permissions */
	delete context.config.allow;
	delete context.config.deny;
	
	return false;
};

exports.requestFile = function(context) {
	var client = context.remoteAddress;
	var allow = context.config.allow;
	var deny = context.config.deny;
	
	if(!checkPermissions(client, allow, deny, false)) {
		context.error(403, 'Forbidden', 'The file is forbidden because of the directory config', true);
		return true;
	}
	
	return false;
};
