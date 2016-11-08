
function Ttk91jsRuntimeException(message, line) {
	this.name = 'Ttk91jsRuntimeException';
	this.message = message;
	this.line = line;
}

Ttk91jsRuntimeException.prototype.toString = function() {
	return this.name + ': ' + this.message;
};

module.exports = {
	Ttk91jsRuntimeException: Ttk91jsRuntimeException
};