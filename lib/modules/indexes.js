var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'indexes';

exports.init = function(server) {
	server.addHook('requestFile', 850, requestFile);
};

var requestFile = function(context, dispatcher) {
	var conf = context.config;
	
	if(!conf.index || conf.index.length == 0) {
		return false;
	}
	if(!context.pathStat.isDirectory()) {
		return false;
	}
	
	var indexStack = [];
	indexStack.push.apply(indexStack, conf.index);
	
	var checkNext = function() {
		if(indexStack.length == 0) {
			// Not success
			dispatcher.dispatchNext();
			return;
		}
		var next = indexStack.shift();
		
		var nextPath = nodePath.join(context.path, next);
		
		nodePath.exists(nextPath, function(exists) {
			try {
				if(exists) {
					// index file found, making new request
					var newUrl = nodePath.join(context.location, next);
					context.dispatchUrl(newUrl, function(result, error) {
						dispatcher.dispatchNext(result, error);
					});
				} else {
					checkNext();
				}
			}catch(e) {
				dispatcher.exception(e);
			}
		});
	};
	
	checkNext();
	
	return 'async-dispatch';
}