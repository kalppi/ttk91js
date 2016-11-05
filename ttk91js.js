var compile = require('./ttk91js.compile.js');
var Machine = require('./ttk91js.machine.js');

var module = {
	compile: compile,
	createMachine: function(settings) {
		return new Machine(settings);
	}
};

if(typeof window == 'undefined') {
	module.exports = module;
} else {
	window.ttk91js = module;
}


