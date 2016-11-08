
function Ttk91jsRuntimeException(message) {
	this.name = 'Ttk91jsRuntimeException';
	this.message = message;
}

Ttk91jsRuntimeException.prototype.toString = function() {
	return this.name + ': ' + this.message;
};

function Ttk91jsCompileException(message, line) {
	this.name = 'Ttk91jsCompileException';
	this.message = message;
	this.line = line;
}

Ttk91jsCompileException.prototype.toString = function() {
	return this.name + ': ' + this.message;
};

module.exports = {
	Ttk91jsCompileException: Ttk91jsCompileException,
	Ttk91jsRuntimeException: Ttk91jsRuntimeException
};