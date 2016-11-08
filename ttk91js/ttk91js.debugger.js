const CompileException = require('./ttk91js.exceptions.js').Ttk91jsCompileException;
const RuntimeException = require('./ttk91js.exceptions.js').Ttk91jsRuntimeException;

function Debugger(data) {
	this.PC = 0;
	this.IR = 0;

	this.symbols = Object.freeze(data.symbols);
	this.sourceMap = Object.freeze(data.sourceMap);
}

Debugger.prototype = {
	cycle: function(PC, IR) {
		this.PC = PC;
		this.IR = IR;
	},

	getCurrentLineNumber: function() {
		return this.getLineNumber(this.PC);
	},

	getLineNumber: function(ln) {
		if(ln instanceof RuntimeException) return this.getLineNumber(this.PC);
		else if(ln < 0 || ln >= this.sourceMap.length) return null;

		return this.sourceMap[ln];
	}
};

module.exports = Debugger;