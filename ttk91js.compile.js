var ttk91js = (function(ttk91js) {
	'use strict';

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

	var OPS = Object.keys(OP);

	const OUTPUT = {
		CRT: 0
	};

	const SVC = {
		HALT: 11
	};

	const MODE = {
		IMMEDIATE: 0,
		DIRECT: 1,
		INDIRECT: 2
	};

	const SP = 6;
	const FP = 7;

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
				symbols.push(parts[0]);
				data.push(instructions.length);

				parts.shift();
			}

			if(parts[0] == 'DC') {
				data.pop();
				data.push(parseInt(parts[1]));
			} else {
				if(parts.length == 3) {
					if(parts[1][parts[1].length - 1] != ',') {
						console.log('ERROR1');
					} else {
						parts[1] = parts[1].substring(0, parts[1].length - 1);
					}
				}

				if(parts.length == 3) {
					i = parts[2].indexOf('(');
					if(i != -1) {
						var j = parts[2].indexOf(')', i);
						if(j == -1) {
							console.log('ERROR2');
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

	ttk91js.compile = function(code) {
		var data = prepare(code);

		function getAddr(addr) {
			for(var i = 0; i < data.symbols.length; i++) {
				if(data.symbols[i] == addr) {
					return data.code.length + i;
				}
			}

			console.log('ERROR3');
		}

		function isRegister(reg) {
			return (reg == 'SP' || (reg.length == 2 && reg[0] == 'R'));
		}

		function getRegister(reg) {
			if(reg == 'SP') return SP;
			else return parseInt(reg[1]);
		}

		var words = [];

		for(var d of data.code) {
			if(isRegister(d[1])) {
				d[1] = getRegister(d[1]);
			} else {
				d[1] = getAddr(d[1]);
			}


			var op = OP[d[0]];
			var rj = d[1];
			var ri = 0;

			var m = MODE.DIRECT;
			var addr = 0;

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
						addr = getAddr(d[2]);
					} else {
						addr = parseInt(d[2]);
					}
				}

				ri = getRegister(d[3]);
			}

			if(op >= OP.JUMP && op <= OP.JNGRE) {
				addr = rj;
				rj = 0;
				m = 0;
			}

			var word = makeWord(op, rj, m, ri, addr);
			words.push(word);
		}

		return {lines: data.code, code: words, symbols: data.symbols, data: data.data, lineMap: data.lineMap};
	};


	var ttk91Debug = {
		word: function(word) {
			var s = ('0'.repeat(32) + (word >>> 0).toString(2)).slice(-32);
			console.log(s.substr(0, 8) + ' ' + s.substr(8, 3) + ' ' + s.substr(11, 2) + ' ' + s.substr(13, 3) + ' ' + s.substr(16));
		},
		bin: function(dec) {
			console.log(('0'.repeat(32) + (dec >>> 0).toString(2)).slice(-32));
		}
	};

	return ttk91js;
})(ttk91js || {});


if(typeof module !== 'undefined' && 'exports' in module) {
	module.exports = ttk91js;
}
