'use strict';

var MicroEvent = require('microevent');
var global = require('./ttk91js.global.js');
var Ttk91jsRuntimeException = require('./ttk91js.exceptions.js').Ttk91jsRuntimeException;
var Memory = require('./ttk91js.memory.js');
var Debugger = require('./ttk91js.debugger.js');

const OUTPUT = {
	CRT: 0
};

const SVC = {
	HALT: 11
};

const OP = global.OP;
const SR_BITS = global.SR_BITS;

const SP = 6;
const FP = 7;
const PC = 8;

function Machine(settings) {
	this.settings = settings;
	this.memory = new Memory(this, settings.memory);
	this.reg = new Uint32Array(9);

	this.stdout = {
		write: function(out) {
			process.stdout.write(out + '\n');
		}
	};

	this.debugger = new Debugger();

	this.reset();
}

Machine.prototype = {
	_getValue: function(m, ri, addr) {
		var value = 0;

		if(ri === 0) value = addr;
		else value = this.reg[ri] + addr;

		if(m == 3) {
			throw new Ttk91jsRuntimeException('Invalid memory access mode', this.debugger.PC);
		} if(m > 0) {
			value = this._getValue(--m, ri, this.memory.getAt(addr));
		}

		return value;
	},

	reset: function() {
		this.ok = true;
		this.SR = 0;
		this.reg.fill(0);
		this.memory.reset();
		this.data = null;
	},

	load: function(data) {
		var i = 0;
		for(; i < data.code.length; i++) {
			this.memory.setAt(i, data.code[i]);
		}

		let pos = 0;
		for(let j = 0; j < data.data.length; j++) {
			this.memory.setAt(i + pos, data.data[j].value);
			pos += data.data[j].size;
		}

		this.data = data;
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
		return this.ok && this.reg[PC] < this.memory.size();
	},

	runWord: function(count) {
		count = count || 1;

		for(var i = 0; i < count; i++) {
			this._runWord();
		}
	},

	_runWord: function() {
		let IR = this.memory.getAt(this.reg[PC]);

		this.debugger.cycle(this.reg[PC], IR);
		
		var [op, rj, m, ri, addr] = global.splitWord(IR);
		var value = this._getValue(m, ri, addr);

		this.reg[PC]++;

		switch(op) {
			case OP.NOP:
				break;
			case OP.STORE:
				if(this.settings.triggerMemoryWrite) {
					this.trigger('memory-write', value, this.memory.getAt(value), this.reg[rj]);
				}

				this.memory.setAt(value, this.reg[rj]);

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

				if(this.reg[rj] == value) this.SR |= SR_BITS.E;
				if(this.reg[rj] > value) this.SR |= SR_BITS.G;
				if(this.reg[rj] < value) this.SR |= SR_BITS.L;

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
				if(this.SR & SR_BITS.E) this.reg[PC] = this.memory.getAt(addr);
			
				break;
			case OP.JGRE:
				break;
			case OP.JNLES:
				break;
			case OP.JNEQU:
				if(!(this.SR & SR_BITS.E)) this.reg[PC] = this.memory.getAt(addr);

				break;
			case OP.JNGRE:
				break;
			default:
				throw new Ttk91jsRuntimeException('unknown opcode (' + op + ')', this.debugger.PC);
		}

		if(this.settings.triggerRegisterWrite) {
			this.trigger('register-write', PC, this.debugger.PC, this.reg[PC]);
		}
	}
};

MicroEvent.mixin(Machine);

module.exports = Machine;