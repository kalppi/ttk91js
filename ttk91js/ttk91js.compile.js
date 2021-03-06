'use strict';

const common = require('./ttk91js.common.js');
const CompileException = require('./ttk91js.exceptions.js').Ttk91jsCompileException;
const Debugger = require('./ttk91js.debugger.js');

const OPS = Object.keys(common.OP);

const OUTPUT = {
	CRT: 0
};

const SVC = {
	HALT: 11
};

const MODE = common.MODE;

const SP = 6;
const FP = 7;



function makeWord(op, rj, m, ri, addr) {
	let word = 0;

	if(addr >= 0) word |= addr;
	else word = (~Math.abs(addr) & 0xFFFF) + 1;

	word |= (op << 24);
	word |= (rj << 21);
	word |= (m << 19);
	word |= (ri << 16);

	return word;
}

function getOpArgCount(op) {
	op = common.OP[op];

	if(op === common.OP.NOP) return 0;
	else if(op == common.OP.NOT) {
		return 1;
	} else if(op >= common.OP.JUMP && op <= common.OP.JNGRE) {
		return 1;
	}

	return 3;
}

function isRegister(reg) {
	if(reg.length != 2) return false;
	
	reg = reg.toUpperCase();
	if(reg == 'SP' || reg == 'FP') return true;
	else return (reg[0] == 'R' && /[0-9]/.test(reg[1]));
}

function isSymbol(s) {
	if(s[0] == '=' || s[0] == '@') {
		s = s.substring(1);
	}

	return /^[a-z][0-9a-z]*$/i.test(s);
}

function isInteger(s) {
	if(s[0] == '=' || s[0] == '@') {
		s = s.substring(1);
	}

	return /^-*[0-9]+$/.test(s);
}

function isValidArgument(s) {
	return (isSymbol(s) || isRegister(s) || isInteger(s));
}

function prepare(code) {
	const lines = code.split('\n');
	const instructions = [];
	const sourceMap = [];

	const symbols = [];
	const data = [];

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

		switch(s.toUpperCase()) {
			case 'CRT':
			case 'HALT':
				return true;
		}

		return false;
	}

	let memoryPos = 0;

	for(let l = 0; l < lines.length; l++) {
		let line = lines[l].trim();

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

		if(OPS.indexOf(parts[0].toUpperCase()) == -1) {
			if(parts.length == 1) {
				throw new CompileException('unknown opcode (' + parts[0] +')', l);
			}

			symbols.push({
				name: parts[0],
				value: instructions.length,
				type: 'absolute',
				size: 1
			});
			
			i = parts[1].indexOf(' ');
			if(i != -1) parts = [parts[1].substring(0, i), parts[1].substring(i + 1)];
		}

		parts[0] = parts[0].toUpperCase();

		let value, name;

		switch(parts[0]) {
			case 'EQU':
				value = parseInt(parts[1]);
				name = symbols.pop().name;

				symbols.push({
					name: name,
					value: value,
					type: 'absolute',
					size: 0
				});

				break;
			case 'DC':
				value = parseInt(parts[1]);
				name = symbols.pop().name;

				symbols.push({
					name: name,
					value: memoryPos,
					type: 'relative',
					size: 1
				});

				data.push({
					value: value,
					size: 1
				});

				memoryPos += 1;

				break;
			case 'DS':
				let size = parseInt(parts[1]);
				name = symbols.pop().name;
				
				symbols.push({
					name: name,
					value: memoryPos,
					type: 'relative',
					size: size
				});

				data.push({
					value: 0,
					size: size
				});

				memoryPos += size;

				break;
			default:
				let op = parts.shift();

				let args = [];
				if(parts.length > 0) {
					args = parts.join('').split(',').map((s) => {
						return s.trim();
					});
				}


				if(OPS.indexOf(op) == -1) {
					throw new CompileException('unknown opcode (' + op +')', l);
				}

				if(args.length == 2) {
					i = args[1].indexOf('(');
					if(i != -1) {
						let j = args[1].indexOf(')', i);
						if(j == -1) {
							throw new CompileException('syntax error', l);
						} else {
							args.push(args[1].substring(i+1,j));
							args[1] = args[1].substring(0, i);
						}
					} else if(args[1].length > 0) {
						if(args[1][0] == '=') {
							args.push('R0');
						} else if(args[1][0] == '@') {
							if(args[1][1].toUpperCase() == 'R') {
								args.push('R' + args[1][2]);
								args[1] = '0';
							} else {
								args.push('R0');
							}
						} else {
							if(args[1][0].toUpperCase() == 'R') {
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
						throw new CompileException('syntax error (' + line + ')', l);
					}
				});

				args.forEach((arg) => {
					if(arg.length == 2 && arg[0].toUpperCase() == 'R') {
						if(/0-9/.test(arg[1]) || parseInt(arg[1]) > 7) {
							throw new CompileException('invalid register (' + arg + ')', l);
						}
					}
				});

				if(getOpArgCount(op) != args.length) {
					throw new CompileException('wrong argcount (' + op + ')', l);
				}

				sourceMap.push(l);

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
				throw new CompileException('unknown symbol (' + symbol + ')', ins.line);
			}
		} else if(ins.code.length == 4 && isSymbol(ins.code[2])) {
			let symbol = getSymbol(ins.code[2]);

			if(!symbolExists(symbol)) {
				throw new CompileException('unknown symbol (' + symbol + ')', ins.line);
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

const compile = function(code) {
	const data = prepare(code);

	function getSymbolValue(symbol) {
		for(let i = 0; i < data.symbols.length; i++) {
			if(data.symbols[i].name == symbol) {
				return data.symbols[i].value;
			}
		}
	}

	function getRegister(reg) {
		if(reg == 'SP') return SP;
		else return parseInt(reg[1]);
	}

	const words = [];

	for(let i = 0; i < data.symbols.length; i++) {
		if(data.symbols[i].type == 'relative') {
			data.symbols[i].value += data.code.length;
		}

		delete data.symbols[i].type;
	}

	
	for(let ins of data.code) {
		let d = ins.code;
		let op = common.OP[d[0]];

		let rj = 0;
		let ri = 0;

		let m = MODE.DIRECT;
		let addr = 0;

		if(d.length > 1) {
			if(isRegister(d[1])) {
				rj = getRegister(d[1]);
			} else {
				rj = getSymbolValue(d[1]);
			}
		}

		if(d.length > 2) {
			ri = getRegister(d[3]);

			if(ri !== 0) m = MODE.IMMEDIATE;

			if(op == common.OP.STORE) {
				m = MODE.IMMEDIATE;
			}

			if(d[2][0] == '=') {
				m = MODE.IMMEDIATE;

				let s = d[2].substring(1);

				if(isInteger(s)) {
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
							addr = getSymbolValue(s);
					}
				}
			} else if(d[2][0] == '@') {
				m = MODE.INDIRECT;

				let s = d[2].substring(1);

				addr = getSymbolValue(s);
			} else {
				if(isSymbol(d[2])) {
					addr = getSymbolValue(d[2]);
				} else {
					addr = parseInt(d[2]);
				}
			}
		}

		if(op >= common.OP.JUMP && op <= common.OP.JNGRE) {
			addr = rj;
			rj = 0;
			m = 0;
		}

		const word = makeWord(op, rj, m, ri, addr);

		words.push(word);
	}
	
	return {
		code: words,
		data: data.data,
		debugData: {
			symbols: Object.freeze(data.symbols),
			sourceMap: Object.freeze(data.sourceMap)
		}
	};
};

module.exports = compile;
