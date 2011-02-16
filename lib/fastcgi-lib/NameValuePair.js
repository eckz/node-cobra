
var NameValuePair = function(name, value) {
	if(Buffer.isBuffer(name)) {
		var buffer = name;
	} else {
		this.name = name;
		this.value = value;
	}
	
	this.write = function(buffer, offset) {
		
	};
};

exports.NameValuePair = NameValuePair;