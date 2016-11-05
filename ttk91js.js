
var compile = require('./ttk91js.compile.js');
var Machine = require('./ttk91js.machine.js');

module.exports = {
	compile: compile,
	createMachine: function(settings) {
		return new Machine(settings);
	}
};