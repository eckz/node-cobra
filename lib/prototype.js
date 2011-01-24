/*
 * Override object with supplied parameters
 */
Object.defineProperty(Object.prototype, "extend", {
    enumerable: false,
    value: function(from, checkDest) {
        var props = Object.getOwnPropertyNames(from);
        var dest = this;
        props.forEach(function(name) {
            var destination = Object.getOwnPropertyDescriptor(from, name);
            if(checkDest === true) {
            	if(!Object.hasOwnProperty(dest,name)) {
            		throw 'Property \'' + name + '\' does not exist in destination object';
            	}
            }
            Object.defineProperty(dest, name, destination);
        });
        return this;
    }
});