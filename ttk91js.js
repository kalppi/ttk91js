var compile = require('./ttk91js.compile.js');
var machine = require('./ttk91js.machine.js');

module.exports = {
	compile: compile.compile,
	createMachine: function(settings) {
		return new machine.Machine(settings);
	}
};