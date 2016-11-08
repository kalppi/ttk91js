'use strict';

const MicroEvent = require('microevent');
const common = require('./ttk91js.common.js');
const RuntimeException = require('./ttk91js.exceptions.js').Ttk91jsRuntimeException;
const Registers = require('./ttk91js.registers.js');
const Memory = require('./ttk91js.memory.js');
const Debugger = require('./ttk91js.debugger.js');

const OUTPUT = {
	CRT: 0
};

const SVC = {
	HALT: 11
};

const OP = common.OP;
const SR_BITS = common.SR_BITS;

const SP = 6;
const FP = 7;
const PC = 8;

function Machine(settings) {
	this.settings = settings;
	this.memory = Object.freeze(new Memory(this, settings.memory || 512));
	this.registers = new Registers(this);

	this.stdout = {
		write: function(out) {
			process.stdout.write(out + '\n');
		}
	};

	this.reset();
}

Machine.prototype = {
	getDebugger: function() {
		return this.debugger;
	},

	reset: function() {
		this.ok = true;
		this.SR = 0;
		this.registers.reset();
		this.memory.reset();
		this.debugger = null;
	},

	load: function(data) {
		for(var i = 0; i < data.code.length; i++) {
			this.memory.setAt(i, data.code[i], true);
		}

		let pos = 0;
		for(let j = 0; j < data.data.length; j++) {
			this.memory.setAt(i + pos, data.data[j].value, true);
			pos += data.data[j].size;
		}

		this.debugger = new Debugger(data.debugData);
	},

	getRegisters: function() {
		return this.registers;
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

		let loop = 0;

		while(this.isRunning()) {
			this.runWord();
			loop++;

			if((max > 0) && loop >= max) {
				break;
			}
		}
	},

	isRunning: function() {
		return this.ok && this.registers.get(PC) < this.memory.size();
	},

	runWord: function(count) {
		count = count || 1;

		for(let i = 0; i < count; i++) {
			this._runWord();
		}
	},

	_getValue: function(m, ri, addr) {
		let value = 0;

		if(ri === 0) value = addr;
		else value = this.registers.get(ri) + addr;

		if(m >= 3) {
			throw new RuntimeException('Invalid memory access mode');
		} else if(m > 0) {
			value = this._getValue(--m, ri, this.memory.getAt(addr));
		}

		return value;
	},

	_runWord: function() {
		const IR = this.memory.getAt(this.registers.get(PC));

		this.debugger.cycle(this.registers.get(PC), IR);
		
		const [op, rj, m, ri, addr] = common.splitWord(IR);
		const TR = this._getValue(m, ri, addr);

		this.registers.add(PC, 1);

		switch(op) {
			case OP.NOP:
				break;
			case OP.STORE:
				this.memory.setAt(TR, this.registers.get(rj));

				break;
			case OP.LOAD:

				this.registers.set(rj, TR);

				break;
			case OP.OUT:
				switch(addr) {
					case OUTPUT.CRT:
						this.stdout.write(this.registers.get(rj));

						break;
				}

				break;

			case OP.ADD:
				this.registers.add(rj, TR);
				break;
			case OP.SUB:
				this.registers.add(rj, -TR);
				break;
			case OP.DIV:
				this.registers.set(rj, Math.floor(this.registers.get(rj) / TR));
				break;
			case OP.MUL:
				this.registers.set(rj, this.registers.get(rj) * TR);
				break;
			case OP.MOD:
				this.registers.set(rj, this.registers.get(rj) % TR);
				break;
			case OP.AND:
				this.registers.set(rj, this.registers.get(rj) & TR);
				break;
			case OP.OR:
				this.registers.set(rj, this.registers.get(rj) | TR);
				break;
			case OP.XOR:
				this.registers.set(rj, this.registers.get(rj) ^ TR);
				break;
			case OP.SHL:
				this.registers.set(rj, this.registers.get(rj) << TR);
				break;
			case OP.SHR:
				this.registers.set(rj, this.registers.get(rj) >> TR);
				break;
			case OP.SHRA:
				this.registers.set(rj, this.registers.get(rj) >>> TR);
				break;
			case OP.NOT:
				this.registers.set(rj, ~this.registers.get(rj));
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

				let v = this.registers.get(rj);

				if(v == TR) this.SR |= SR_BITS.E;
				if(v > TR) this.SR |= SR_BITS.G;
				if(v < TR) this.SR |= SR_BITS.L;

				break;
			case OP.JUMP:
				this.registers.set(PC, addr);

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
				if(this.SR & SR_BITS.E) this.registers.set(PC, this.memory.getAt(addr));
			
				break;
			case OP.JGRE:
				break;
			case OP.JNLES:
				break;
			case OP.JNEQU:
				if(!(this.SR & SR_BITS.E)) this.registers.set(PC, this.memory.getAt(addr));

				break;
			case OP.JNGRE:
				break;
			default:
				throw new RuntimeException('unknown opcode (' + op + ')');
		}

		this.debugger.cycleEnd(this.registers.get(PC));
	}
};

MicroEvent.mixin(Machine);

module.exports = Machine;