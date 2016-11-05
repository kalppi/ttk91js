var compile = require('./ttk91js.compile.js');
var Machine = require('./ttk91js.machine.js');

(function(root) {
	var module = {
		compile: compile,
		createMachine: function(settings) {
			return new Machine(settings);
		}
	};

	if(typeof module !== 'undefined' && 'exports' in module) {
		module.exports = module;
	} else {
		root.ttk91js = module;
	}
})(this);

