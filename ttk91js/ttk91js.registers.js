const Ttk91jsRuntimeException = require('./ttk91js.exceptions.js').Ttk91jsRuntimeException;

function Registers(machine) {
	this.machine = machine;
	this.reg = new Uint32Array(9);
}

Registers.prototype = {
	set: function(addr, value) {
		if(addr < 0 || addr >= this.reg.length) {
			throw new Ttk91jsRuntimeException('trying to access invalid register (' + addr + ')');
		}

		if(this.machine.settings.triggerRegisterWrite) {
			this.machine.trigger('register-write', addr, this.reg[addr], value);
		}

		this.reg[addr] = value;
	},

	get: function(addr) {
		if(addr < 0 || addr >= this.reg.length) {
			throw new Ttk91jsRuntimeException('trying to access invalid register (' + addr + ')');
		}

		return this.reg[addr];
	},

	add: function(addr, val) {
		this.set(addr, this.reg[addr] + val);
	},

	getAll: function() {
		return this.reg;
	},

	reset: function() {
		this.reg.fill(0);
	},
};

module.exports = Registers;