
Object.extend = function(dest, from, checkDest) {
	var props = Object.getOwnPropertyNames(from);
	props.forEach(function(name) {
		var destination = Object.getOwnPropertyDescriptor(from, name);
		if(checkDest === true) {
			if(!Object.hasOwnProperty(dest,name)) {
				throw new Error('Property \'' + name + '\' does not exist in destination object');
			}
		}
		Object.defineProperty(dest, name, destination);
    });
	return dest;
};

Object.defineProperty(Object.prototype, "extend", {
    enumerable: false,
    value: function(from, checkDest) {
        return Object.extend(this, from, checkDest);
    }
});

/*
 * Override object with supplied parameters
 */
Object.extendRecursive = function(dest, from) {
	var props = Object.getOwnPropertyNames(from);
	props.forEach(function(name) {
		var destValue = dest[name];
		var fromValue = from[name];
		if(Array.isArray(destValue)) {
			dest[name] = destValue.concat(fromValue);
		} else if(typeof destValue === 'object' && typeof fromValue === 'object') {
			Object.extendRecursive(destValue, fromValue);
		} else {
			dest[name] = fromValue;
		}
    });
	return dest;
};

/*
 * Buffer prototype
 */

(function () {

function _bufferMatch(buffer, contents, offset) {
	if(contents.length + offset > buffer.length) {
		throw new Error('Invalid argument');
	}
	
	for(var i = 0; i < contents.length; i++) {
		if(buffer[offset + i] !== contents[i]) {
			return false;
		}
	}
	return true;
};

Buffer.prototype.indexOf = function indexOf(str, start, end) {
	var buffer = this;
	var contents = str;
	
	if(typeof str === 'string') {
		contents = str.split('');
		contents = contents.map(function(c) {
			return c.charCodeAt(0);
		});
	}
	
	if(!Array.isArray(contents)) {
		throw new TypeError('Invalid str type');
	}
	
	start = start || 0;
	end = end || buffer.length;
	
	end = end - contents.length + 1;
	for(var i = start; i < end; i++) {
		if(_bufferMatch(buffer, contents, i)) {
			return i;
		}
	}
	return -1;
};

})();
