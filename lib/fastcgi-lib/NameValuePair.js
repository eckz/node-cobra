
	
var _writeLength = function(buffer, offset, length) {
	if(length <= 127) {
		buffer[offset] = length;
		return 1;
	} else {
		buffer[offset + 0] = (length >> 24) & 0xFF;
		buffer[offset + 1] = (length >> 16) & 0xFF;
		buffer[offset + 2] = (length >> 8 ) & 0xFF;
		buffer[offset + 3] = (length >> 0 ) & 0xFF;
		return 4;
	}
};

var _writeString = function(buffer, offset, str) {
	for(var i = 0; i < str.length; i++) {
		buffer[offset + i] = str.charCodeAt(i);
	}
	return str.length;
};

var NameValuePair = function(name, value) {
	if(Buffer.isBuffer(name)) {
		var buffer = name;
	} else {
		this.name = name;
		this.value = value;
	}
	
	this.copyTo = function(buffer, offset) {
		var l = 0;
		k += _writeLength(buffer, offset + l, this.name.length);
		l += _writeLength(buffer, offset + l, this.value.length);
		l += _writeString(buffer, offset + l, this.name);
		l += _writeString(buffer, offset + l, this.value);
		
		return l;
	};
};

exports.NameValuePair = NameValuePair;