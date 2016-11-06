'use strict';

var global = require('./ttk91js.global.js');

var OPS = Object.keys(global.OP);

const OUTPUT = {
	CRT: 0
};

const SVC = {
	HALT: 11
};

const MODE = global.MODE;

const SP = 6;
const FP = 7;

function Ttk91jsCompileException(message, line) {
	this.name = 'Ttk91jsCompileException';
	this.message = message;
	this.line = line;
}

Ttk91jsCompileException.prototype.toString = function() {
	return this.name + ': ' + this.message;
};

function makeWord(op, rj, m, ri, addr) {
	var word = addr;
	word |= (op << 24);
	word |= (rj << 21);
	word |= (m << 19);
	word |= (ri << 16);

	return word;
}

function prepare(code) {
	var lines = code.split('\n');
	var instructions = [];
	var lineMap = {};

	var symbols = [];
	var data = [];

	for(var l = 0; l < lines.length; l++) {
		var line = lines[l].trim();

		var i = line.indexOf(';');
		if(i != -1) {
			line = line.substring(0, i);
		}

		if(line.length === 0) {
			continue;
		}

		var parts = line.split(/[\s]+/);

		if(OPS.indexOf(parts[0]) == -1) {
			symbols.push({
				name: parts[0],
				addr: instructions.length,
				type: 'absolute'
			});
			
			parts.shift();
		}

		if(parts[0] == 'DC') {
			let value = parseInt(parts[1]);
			let name = symbols.pop().name;
			
			symbols.push({
				name: name,
				addr: data.length,
				type: 'relative'
			});

			data.push(value);
		} else {
			if(parts.length == 3) {
				if(parts[1][parts[1].length - 1] != ',') {
					throw new Ttk91jsCompileException('syntax error', l);
				} else {
					parts[1] = parts[1].substring(0, parts[1].length - 1);
				}
			}

			if(parts.length == 3) {
				i = parts[2].indexOf('(');
				if(i != -1) {
					var j = parts[2].indexOf(')', i);
					if(j == -1) {
						throw new Ttk91jsCompileException('syntax error', l);
					} else {
						parts.push(parts[2].substring(i+1,j));
						parts[2] = parts[2].substring(0, i);
					}
				} else {
					if(parts[2][0] == '=') {
						parts.push('R0');
					} else if(parts[2][0] == '@') {
						if(parts[2][1] == 'R') {
							parts.push('R' + parts[2][2]);
							parts[2] = '0';
						} else {
							parts.push('R0');
						}
					} else {
						if(parts[2][0] == 'R') {
							parts.push(parts[2]);
							parts[2] = '=0';
						} else {
							parts.push('R0');
						}
					}
				}
			}

			if(parts[0] != 'DC' && OPS.indexOf(parts[0]) == -1) {
				throw new Ttk91jsCompileException('unknown opcode (' + parts[0] +')', l);
			}

			parts.forEach((part) => {
				if(part.length == 2 && part[0] == 'R') {
					if(/0-9/.test(part[1]) || parseInt(part[1]) > 7) {
						throw new Ttk91jsCompileException('invalid register (' + part + ')', l);
					}
				}
			});

			lineMap[instructions.length] = l;

			instructions.push(parts);
		}
	}

	return {
		code: instructions,
		symbols: symbols,
		data: data,
		lineMap: lineMap
	};
}

var compile = function(code) {
	var data = prepare(code);

	function getSymbolAddr(symbol) {
		for(let i = 0; i < data.symbols.length; i++) {
			if(data.symbols[i].name == symbol) {
				return data.symbols[i].addr;
			}
		}

		throw new Ttk91jsCompileException('unknown symbol (' + symbol + ')');
	}

	function isRegister(reg) {
		return (reg == 'SP' || (reg.length == 2 && reg[0] == 'R'));
	}

	function getRegister(reg) {
		if(reg == 'SP') return SP;
		else return parseInt(reg[1]);
	}

	var words = [];

	for(let i = 0; i < data.symbols.length; i++) {
		if(data.symbols[i].type == 'relative') {
			data.symbols[i].addr += data.code.length;
		}

		delete data.symbols[i].type;
	}

	for(var d of data.code) {
		var op = global.OP[d[0]];

		var rj = 0;
		var ri = 0;

		var m = MODE.DIRECT;
		var addr = 0;

		if(d.length > 1) {
			if(isRegister(d[1])) {
				rj = getRegister(d[1]);
			} else {
				rj = getSymbolAddr(d[1]);
			}
		}

		if(d.length > 2) {
			if(d[2][0] == '=') {
				m = MODE.IMMEDIATE;

				var s = d[2].substring(1);

				if(/^[0-9]+$/i.test(s)) {
					addr = parseInt(s);
				} else {
					switch(s) {
						case 'CRT':
							addr = OUTPUT.CRT;
							break;
						case 'HALT':
							addr = SVC.HALT;
							break;
					}
				}
			} else if(d[2][0] == '@') {
				m = MODE.INDIRECT;
				addr = parseInt(d[2].substring(1));
			} else {
				if(/^[a-z]+$/i.test(d[2])) {
					addr = getSymbolAddr(d[2]);
				} else {
					addr = parseInt(d[2]);
				}
			}

			ri = getRegister(d[3]);
		}

		if(op >= global.OP.JUMP && op <= global.OP.JNGRE) {
			addr = rj;
			rj = 0;
			m = 0;
		}

		var word = makeWord(op, rj, m, ri, addr);

		words.push(word);
	}
	
	return {lines: data.code, code: words, symbols: data.symbols, data: data.data, lineMap: data.lineMap};
};

module.exports = compile;
