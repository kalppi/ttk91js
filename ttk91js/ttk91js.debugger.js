
function Debugger() {
	this.PC = 0;
	this.IR = 0;
}

Debugger.prototype = {
	cycle: function(PC, IR) {
		this.PC = PC;
		this.IR = IR;
	}
};

module.exports = Debugger;