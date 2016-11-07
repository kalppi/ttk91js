'use strict';

var MicroEvent = require('microevent');
var global = require('./ttk91js.global.js');

const OUTPUT = {
	CRT: 0
};

const SVC = {
	HALT: 11
};

const BIT_L = 4;
const BIT_E = 2;
const BIT_G = 1;

const SP = 6;
const FP = 7;
const PC = 8;

const OP = global.OP;

function Ttk91jsRuntimeException(message, line) {
	this.name = 'Ttk91jsRuntimeException';
	this.message = message;
	this.line = line;
}

Ttk91jsRuntimeException.prototype.toString = function() {
	return this.name + ': ' + this.message;
};

function Machine(settings) {
	this.settings = settings;

	this.memory = new Uint32Array(settings.memory);
	this.reg = new Uint32Array(9);

	this.stdout = {
		write: function(out) {
			process.stdout.write(out + '\n');
		}
	};

	this.oldPC = 0;
	this.data = null;

	this.reset();
}

Machine.prototype = {
	_getValue: function(m, ri, addr) {
		var value = 0;

		if(ri === 0) value = addr;
		else value = this.reg[ri] + addr;

		if(m > 0) {
			value = this._getValue(--m, ri, this.getMemoryAt(addr));
		}

		return value;
	},

	load: function(data) {
		var i = 0;
		for(; i < data.code.length; i++) {
			this.memory[i] = data.code[i];
		}

		for(var j = 0; j < data.data.length; j++) {
			this.memory[i + j] = data.data[j];
		}

		this.data = data;
	},

	getMemoryAt: function(addr) {
		if(addr < 0 || addr >= this.memory.length) {
			throw new Ttk91jsRuntimeException('trying to access outside of program memory (' + addr + ')', this.oldPC);
		}

		return this.memory[addr];
	},

	setMemoryAt: function(addr, value) {
		if(addr < 0 || addr >= this.memory.length) {
			throw new Ttk91jsRuntimeException('trying to access outside of program memory (' + addr + ')', this.oldPC);
		}

		this.memory[addr] = value;
	},

	getRegisters: function() {
		return this.reg;
	},

	getMemory: function() {
		return this.memory;
	},

	stop: function() {
		this.ok = false;
	},

	setStdout: function(out) {
		this.stdout = out;
	},

	reset: function() {
		this.ok = true;
		this.SR = 0;
		this.reg.fill(0);
		this.memory.fill(0);
		this.data = null;
		this.oldPC = 0;
	},

	run: function(max) {
		max = max || -1;

		var loop = 0;

		while(this.isRunning()) {
			this.runWord();
			loop++;

			if((max > 0) && loop >= max) {
				break;
			}
		}
	},

	isRunning: function() {
		return this.ok && this.reg[PC] < this.memory.length;
	},

	runWord: function(count) {
		count = count || 1;

		for(var i = 0; i < count; i++) {
			this._runWord();
		}
	},

	_runWord: function() {
		this.oldPC = this.reg[PC];
		
		var [op, rj, m, ri, addr] = global.splitWord(this.getMemoryAt(this.reg[PC]));
		var value = this._getValue(m, ri, addr);

		this.reg[PC]++;

		switch(op) {
			case OP.NOP:
				break;
			case OP.STORE:
				if(this.settings.triggerMemoryWrite) {
					this.trigger('memory-write', addr, this.getMemoryAt(addr), this.reg[rj]);
				}

				this.setMemoryAt(addr, this.reg[rj]);

				break;
			case OP.LOAD:
				if(this.settings.triggerRegisterWrite) {
					this.trigger('register-write', rj, this.reg[rj], value);
				}

				this.reg[rj] = value;				

				break;
			case OP.OUT:
				switch(addr) {
					case OUTPUT.CRT:
						this.stdout.write(this.reg[rj]);

						break;
				}

				break;

			case OP.ADD:
				this.reg[rj] += value;
				break;
			case OP.SUB:
				this.reg[rj] -= value;
				break;
			case OP.DIV:
				this.reg[rj] = Math.floor(this.reg[rj] / value);
				break;
			case OP.MUL:
				this.reg[rj] *= value;
				break;
			case OP.MOD:
				this.reg[rj] = this.reg[rj] % value;
				break;
			case OP.AND:
				this.reg[rj] = this.reg[rj] & value;
				break;
			case OP.OR:
				this.reg[rj] = this.reg[rj] | value;
				break;
			case OP.XOR:
				this.reg[rj] = this.reg[rj] ^ value;
				break;
			case OP.SHL:
				this.reg[rj] = this.reg[rj] << value;
				break;
			case OP.SHR:
				this.reg[rj] = this.reg[rj] >> value;
				break;
			case OP.SHRA:
				this.reg[rj] = this.reg[rj] >>> value;
				break;
			case OP.NOT:
				this.reg[rj] = ~this.reg[rj];
				break;
			case OP.SVC:
				switch(addr) {
					case SVC.HALT:
						this.ok = false;
						this.trigger('halt');

						break;
				}
				break;
			case OP.COMP:
				this.SR = 0;

				if(this.reg[rj] == value) this.SR |= BIT_E;
				if(this.reg[rj] > value) this.SR |= BIT_G;
				if(this.reg[rj] < value) this.SR |= BIT_L;

				break;
			case OP.JUMP:
				this.reg[PC] = addr;

				break;
			case OP.JNEG:
				break;
			case OP.JZER:
				break;
			case OP.JPOS:
				break;
			case OP.JNNEG:
				break;
			case OP.JNZER:
				break;
			case OP.JNPOS:
				break;
			case OP.JLES:
				break;
			case OP.JEQU:
				if(this.SR & BIT_E) this.reg[PC] = this.getMemoryAt(addr);
			
				break;
			case OP.JGRE:
				break;
			case OP.JNLES:
				break;
			case OP.JNEQU:
				if(!(this.SR & BIT_E)) this.reg[PC] = this.getMemoryAt(addr);

				break;
			case OP.JNGRE:
				break;
			default:
				throw new Ttk91jsRuntimeException('unknown opcode (' + op + ')', this.oldPC);
		}

		if(this.settings.triggerRegisterWrite) {
			this.trigger('register-write', PC, this.oldPC, this.reg[PC]);
		}
	}
};

MicroEvent.mixin(Machine);

module.exports = Machine;