const Ttk91jsRuntimeException = require('./ttk91js.exceptions.js').Ttk91jsRuntimeException;

function Memory(machine, size) {
	this.machine = machine;
	this.memory = new Uint32Array(size);
}

Memory.prototype = {
	setAt: function(addr, value) {
		if(addr < 0 || addr >= this.memory.length) {
			throw new Ttk91jsRuntimeException('trying to access outside of program memory (' + addr + ')');
		}

		if(this.machine.settings.triggerMemoryWrite) {
			this.machine.trigger('memory-write', addr, this.memory[addr], value);
		}

		this.memory[addr] = value;
	},

	getAt: function(addr) {
		if(addr < 0 || addr >= this.memory.length) {
			throw new Ttk91jsRuntimeException('trying to access outside of program memory (' + addr + ')');
		}

		return this.memory[addr];
	},

	getAll: function() {
		return this.memory;
	},

	reset: function() {
		this.memory.fill(0);
	},

	size: function() {
		return this.memory.length;
	}
};

module.exports = Memory;