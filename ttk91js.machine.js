'use strict';

var MicroEvent = require('microevent');

const OP = {
	NOP: 0,
	STORE: 1,
	LOAD: 2,
	IN: 3,
	OUT: 4,
	ADD: 17,
	SUB: 18,
	MUL: 19,
	DIV: 20,
	MOD: 21,
	AND: 22,
	OR: 23,
	XOR: 24,
	SHL: 25,
	SHR: 26,
	NOT: 27,
	SHRA: 28,
	COMP: 31,
	JUMP: 32,
	JNEG: 33,
	JZER: 34,
	JPOS: 35,
	JNNEG: 36,
	JNZER: 37,
	JNPOS: 38,
	JLES: 39,
	JEQU: 40,
	JGRE: 41,
	JNLES: 42,
	JNEQU: 43,
	JNGRE: 44,
	CALL: 49,
	EXIT: 50,
	PUSH: 51,
	POP: 52,
	PUSHR: 53,
	POPR: 54,
	SVC: 112
};

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

function splitWord(word) {
	return [
		(word & (0xff << 24)) >> 24,	//op
		(word & (0x7 << 21)) >> 21,		//rj
		(word & (0x3 << 19)) >> 19,		//m
		(word & (0x7 << 16)) >> 16,		//ri
		(word & 0xffff)					//addr
	];
}

function Machine(settings) {
	this.settings = settings;

	this.memory = new Uint32Array(settings.memory);

	this.stdout = function(out) {
		console.log(out);
	};

	this.lastPosition = 0;

	this.reset();
}

Machine.prototype = {
	_getValue: function(m, ri, addr) {
		var value = 0;

		if(ri === 0) value = addr;
		else value = this.reg[ri] + addr;

		if(m > 0) {
			value = this._getValue(--m, ri, this.memory[addr]);
		}

		return value;
	},

	load: function(data) {
		var i = 0;
		for(; i < data.code.length; i++) {
			this.memory[i] = data.code[i];
		}

		for(var j = 0; j < data.symbols.length; j++) {
			this.memory[i + j] = data.data[j];
		}

		this.data = data;
	},

	getRegister: function() {
		return {
			0: this.reg[0],
			1: this.reg[1],
			2: this.reg[2],
			3: this.reg[3],
			4: this.reg[4],
			5: this.reg[5],
			SP: this.reg[SP],
			FP: this.reg[FP],
			PC: this.reg.PC
		};
	},

	getMemory: function() {
		return this.memory;
	},

	getRealLine() {
		return this.data.lineMap[this.lastPosition];
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
		this.reg = {
			0: 0,
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0,
			7: 0,
			FP: 0,
			PC: 0
		};

		this.memory.fill(0);
	},

	run: function() {
		var loops = 0;

		while(this.isRunning() && loops < 100) {
			this.runWord();
			loops++;
		}
	},

	isRunning: function() {
		return this.ok && this.reg.PC < this.memory.length;
	},

	runWord: function(count) {
		count = count || 1;

		for(var i = 0; i < count; i++) {
			this._runWord();
		}
	},

	_runWord: function() {
		var [op, rj, m, ri, addr] = splitWord(this.memory[this.reg.PC]);
		var value = this._getValue(m, ri, addr);

		this.lastPosition = this.reg.PC;
		this.reg.PC++;

		switch(op) {
			case OP.STORE:
				var oldValue = this.memory[addr];

				this.memory[addr] = this.reg[rj];

				if(this.settings.triggerMemoryChange && oldValue != this.memory[addr]) {
					this.trigger('memory-change', addr, oldValue, this.memory[addr]);
				}

				break;
			case OP.LOAD:
				this.reg[rj] = value;

				break;
			case OP.OUT:
				switch(addr) {
					case OUTPUT.CRT:
						this.stdout(this.reg[rj]);

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
			case OP.SVC:
				switch(addr) {
					case SVC.HALT:
						this.ok = false;
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
				this.reg.PC = this.memory[addr];

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
				if(this.SR & BIT_E) this.reg.PC = this.memory[addr];
			
				break;
			case OP.JGRE:
				break;
			case OP.JNLES:
				break;
			case OP.JNEQU:
				if(!(this.SR & BIT_E)) this.reg.PC = this.memory[addr];

				break;
			case OP.JNGRE:
				break;
		}
	}
};

MicroEvent.mixin(Machine);

module.exports = Machine;