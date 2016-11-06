var compile = require('./ttk91js.compile.js');
var Machine = require('./ttk91js.machine.js');

var ttk91js = {
	compile: compile,
	createMachine: function(settings) {
		return new Machine(settings);
	}
};

if(typeof window == 'undefined') {
	module.exports = ttk91js;
} else {
	window.ttk91js = ttk91js;
}