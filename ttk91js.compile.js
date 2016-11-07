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

function getOpArgCount(op) {
	op = global.OP[op];

	if(op === global.OP.NOP) return 0;
	else if(op == global.OP.NOT) {
		return 1;
	} else if(op >= global.OP.JUMP && op <= global.OP.JNGRE) {
		return 1;
	}

	return 2;
}

function isRegister(reg) {
	if(reg.length != 2) return false;
	else if(reg == 'SP' || reg == 'FP') return true;
	else return (reg[0] == 'R' && /[0-9]/.test(reg[1]));
}

function isSymbol(s) {
	if(s[0] == '=' || s[0] == '@') {
		s = s.substring(1);
	}

	return /^[a-z]+$/i.test(s);
}

function isInteger(s) {
	if(s[0] == '=' || s[0] == '@') {
		s = s.substring(1);
	}

	return /^[0-9]+$/.test(s);
}

function isValidArgument(s) {
	return (isSymbol(s) || isRegister(s) || isInteger(s));
}

function prepare(code) {
	var lines = code.split('\n');
	var instructions = [];
	var sourceMap = {};

	var symbols = [];
	var data = [];

	function getSymbol(s) {
		if(s[0] == '=' || s[0] == '@') {
			s = s.substring(1);
		}

		return s;
	}

	function symbolExists(s) {
		for(let sym of symbols) {
			if(sym.name == s) return true;
		}

		switch(s) {
			case 'CRT':
			case 'HALT':
				return true;
		}

		return false;
	}

	let memoryPos = 0;

	for(let l = 0; l < lines.length; l++) {
		var line = lines[l].trim();

		let i = line.indexOf(';');
		if(i != -1) {
			line = line.substring(0, i);
		}

		if(line.length === 0) {
			continue;
		}

		line = line.replace(/\s+/g, ' ');

		i = line.indexOf(' ');
		let parts = null;

		if(i == -1) {
			parts = [line.trim()];
		} else {
			parts = [line.substring(0, i), line.substring(i + 1)];
		}

		if(OPS.indexOf(parts[0]) == -1) {
			if(parts.length == 1) {
				throw new Ttk91jsCompileException('unknown opcode (' + parts[0] +')', l);
			}

			symbols.push({
				name: parts[0],
				addr: instructions.length,
				type: 'absolute',
				size: 1
			});
			
			i = parts[1].indexOf(' ');
			if(i != -1) parts = [parts[1].substring(0, i), parts[1].substring(i + 1)];
		}

		if(parts[0] == 'DC') {
			let value = parseInt(parts[1]);
			let name = symbols.pop().name;

			symbols.push({
				name: name,
				addr: memoryPos,
				type: 'relative',
				size: 1
			});

			data.push({
				value: value,
				size: 1
			});

			memoryPos += 1;
		} else if(parts[0] == 'DS') {
			let size = parseInt(parts[1]);
			let name = symbols.pop().name;
			
			symbols.push({
				name: name,
				addr: memoryPos,
				type: 'relative',
				size: size
			});

			data.push({
				value: 0,
				size: size
			});

			memoryPos += size;
		} else {
			let op = parts.shift();

			let args = [];
			if(parts.length > 0) {
				args = parts.join('').split(',').map((s) => {
					return s.trim();
				});
			}


			if(OPS.indexOf(op) == -1) {
				throw new Ttk91jsCompileException('unknown opcode (' + op +')', l);
			}

			if(args.length == 2) {
				i = args[1].indexOf('(');
				if(i != -1) {
					var j = args[1].indexOf(')', i);
					if(j == -1) {
						throw new Ttk91jsCompileException('syntax error', l);
					} else {
						args.push(args[1].substring(i+1,j));
						args[1] = args[1].substring(0, i);
					}
				} else {
					if(args[1][0] == '=') {
						args.push('R0');
					} else if(args[1][0] == '@') {
						if(args[1][1] == 'R') {
							args.push('R' + args[1][2]);
							args[1] = '0';
						} else {
							args.push('R0');
						}
					} else {
						if(args[1][0] == 'R') {
							args.push(args[1]);
							args[1] = '=0';
						} else {
							args.push('R0');
						}
					}
				}
			}

			args.forEach((arg) => {
				if(!isValidArgument(arg)) {
					throw new Ttk91jsCompileException('syntax error (' + line + ')', l);
				}
			});

			args.forEach((arg) => {
				if(arg.length == 2 && arg[0] == 'R') {
					if(/0-9/.test(arg[1]) || parseInt(arg[1]) > 7) {
						throw new Ttk91jsCompileException('invalid register (' + arg + ')', l);
					}
				}
			});

			if(getOpArgCount(op) != args.length - 1) {
				throw new Ttk91jsCompileException('wrong argcount (' + op + ')', l);
			}

			sourceMap[instructions.length] = l;

			instructions.push({
				line: l,
				code: [op].concat(args)
			});
		}
	}

	for(let ins of instructions) {
		if(ins.code.length == 2 && isSymbol(ins.code[1])) {
			let symbol = getSymbol(ins.code[1]);

			if(!symbolExists(symbol)) {
				throw new Ttk91jsCompileException('unknown symbol (' + symbol + ')', ins.line);
			}
		} else if(ins.code.length == 4 && isSymbol(ins.code[2])) {
			let symbol = getSymbol(ins.code[2]);

			if(!symbolExists(symbol)) {
				throw new Ttk91jsCompileException('unknown symbol (' + symbol + ')', ins.line);
			}
		}
	}

	return {
		code: instructions,
		symbols: symbols,
		data: data,
		sourceMap: sourceMap
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

	
	for(let ins of data.code) {
		var d = ins.code;
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
			ri = getRegister(d[3]);

			if(ri !== 0) m = MODE.IMMEDIATE;

			if(op == global.OP.STORE) {
				m = MODE.IMMEDIATE;
			}

			if(d[2][0] == '=') {
				m = MODE.IMMEDIATE;

				let s = d[2].substring(1);

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
						default:
							addr = getSymbolAddr(s);
					}
				}
			} else if(d[2][0] == '@') {
				m = MODE.INDIRECT;

				let s = d[2].substring(1);

				addr = getSymbolAddr(s);
			} else {
				if(/^[a-z]+$/i.test(d[2])) {
					addr = getSymbolAddr(d[2]);
				} else {
					addr = parseInt(d[2]);
				}
			}

			
		}

		if(op >= global.OP.JUMP && op <= global.OP.JNGRE) {
			addr = rj;
			rj = 0;
			m = 0;
		}

		var word = makeWord(op, rj, m, ri, addr);

		words.push(word);
	}
	
	return {code: words, symbols: data.symbols, data: data.data, sourceMap: data.sourceMap};
};

module.exports = compile;
