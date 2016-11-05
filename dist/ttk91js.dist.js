"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
			}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];return s(n ? n : e);
			}, l, l.exports, e, t, n, r);
		}return n[o].exports;
	}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
		s(r[o]);
	}return s;
})({ 1: [function (require, module, exports) {
		/**
   * MicroEvent - to make any js object an event emitter (server or browser)
   * 
   * - pure javascript - server compatible, browser compatible
   * - dont rely on the browser doms
   * - super simple - you get it immediatly, no mistery, no magic involved
   *
   * - create a MicroEventDebug with goodies to debug
   *   - make it safer to use
  */

		var MicroEvent = function MicroEvent() {};
		MicroEvent.prototype = {
			bind: function bind(event, fct) {
				this._events = this._events || {};
				this._events[event] = this._events[event] || [];
				this._events[event].push(fct);
			},
			unbind: function unbind(event, fct) {
				this._events = this._events || {};
				if (event in this._events === false) return;
				this._events[event].splice(this._events[event].indexOf(fct), 1);
			},
			trigger: function trigger(event /* , args... */) {
				this._events = this._events || {};
				if (event in this._events === false) return;
				for (var i = 0; i < this._events[event].length; i++) {
					this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
				}
			}
		};

		/**
   * mixin will delegate all MicroEvent.js function in the destination object
   *
   * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
   *
   * @param {Object} the object which will support MicroEvent
  */
		MicroEvent.mixin = function (destObject) {
			var props = ['bind', 'unbind', 'trigger'];
			for (var i = 0; i < props.length; i++) {
				destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
			}
		};

		// export in common js
		if (typeof module !== "undefined" && 'exports' in module) {
			module.exports = MicroEvent;
		}
	}, {}], 2: [function (require, module, exports) {
		'use strict';

		var OP = {
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

		var OUTPUT = {
			CRT: 0
		};

		var SVC = {
			HALT: 11
		};

		var MODE = {
			IMMEDIATE: 0,
			DIRECT: 1,
			INDIRECT: 2
		};

		var SP = 6;
		var FP = 7;

		function makeWord(op, rj, m, ri, addr) {
			var word = addr;
			word |= op << 24;
			word |= rj << 21;
			word |= m << 19;
			word |= ri << 16;

			return word;
		}

		function prepare(code) {
			var lines = code.split('\n');
			var instructions = [];
			var lineMap = {};

			var symbols = [];
			var data = [];

			for (var l = 0; l < lines.length; l++) {
				var line = lines[l].trim();

				var i = line.indexOf(';');
				if (i != -1) {
					line = line.substring(0, i);
				}

				if (line.length === 0) {
					continue;
				}

				var parts = line.split(/[\s]+/);

				if (OPS.indexOf(parts[0]) == -1) {
					symbols.push(parts[0]);
					data.push(instructions.length);

					parts.shift();
				}

				if (parts[0] == 'DC') {
					data.pop();
					data.push(parseInt(parts[1]));
				} else {
					if (parts.length == 3) {
						if (parts[1][parts[1].length - 1] != ',') {
							;
						} else {
							parts[1] = parts[1].substring(0, parts[1].length - 1);
						}
					}

					if (parts.length == 3) {
						i = parts[2].indexOf('(');
						if (i != -1) {
							var j = parts[2].indexOf(')', i);
							if (j == -1) {
								;
							} else {
								parts.push(parts[2].substring(i + 1, j));
								parts[2] = parts[2].substring(0, i);
							}
						} else {
							if (parts[2][0] == '=') {
								parts.push('R0');
							} else if (parts[2][0] == '@') {
								if (parts[2][1] == 'R') {
									parts.push('R' + parts[2][2]);
									parts[2] = '0';
								} else {
									parts.push('R0');
								}
							} else {
								if (parts[2][0] == 'R') {
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

		var compile = function compile(code) {
			var data = prepare(code);

			function getAddr(addr) {
				for (var i = 0; i < data.symbols.length; i++) {
					if (data.symbols[i] == addr) {
						return data.code.length + i;
					}
				}

				;
			}

			function isRegister(reg) {
				return reg == 'SP' || reg.length == 2 && reg[0] == 'R';
			}

			function getRegister(reg) {
				if (reg == 'SP') return SP;else return parseInt(reg[1]);
			}

			var words = [];

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = data.code[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var d = _step.value;

					if (isRegister(d[1])) {
						d[1] = getRegister(d[1]);
					} else {
						d[1] = getAddr(d[1]);
					}

					var op = OP[d[0]];
					var rj = d[1];
					var ri = 0;

					var m = MODE.DIRECT;
					var addr = 0;

					if (d.length > 2) {
						if (d[2][0] == '=') {
							m = MODE.IMMEDIATE;

							var s = d[2].substring(1);

							if (/^[0-9]+$/i.test(s)) {
								addr = parseInt(s);
							} else {
								switch (s) {
									case 'CRT':
										addr = OUTPUT.CRT;
										break;
									case 'HALT':
										addr = SVC.HALT;
										break;
								}
							}
						} else if (d[2][0] == '@') {
							m = MODE.INDIRECT;
							addr = parseInt(d[2].substring(1));
						} else {
							if (/^[a-z]+$/i.test(d[2])) {
								addr = getAddr(d[2]);
							} else {
								addr = parseInt(d[2]);
							}
						}

						ri = getRegister(d[3]);
					}

					if (op >= OP.JUMP && op <= OP.JNGRE) {
						addr = rj;
						rj = 0;
						m = 0;
					}

					var word = makeWord(op, rj, m, ri, addr);
					words.push(word);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			return { lines: data.code, code: words, symbols: data.symbols, data: data.data, lineMap: data.lineMap };
		};

		var ttk91Debug = {
			word: function word(_word) {
				var s = ('0'.repeat(32) + (_word >>> 0).toString(2)).slice(-32);
				;
			},
			bin: function bin(dec) {
				;
			}
		};

		module.exports = compile;
	}, {}], 3: [function (require, module, exports) {
		var compile = require('./ttk91js.compile.js');
		var Machine = require('./ttk91js.machine.js');

		var module = {
			compile: compile,
			createMachine: function createMachine(settings) {
				return new Machine(settings);
			}
		};

		if (typeof window == 'undefined') {
			module.exports = module;
		} else {
			window.ttk91js = module;
		}
	}, { "./ttk91js.compile.js": 2, "./ttk91js.machine.js": 4 }], 4: [function (require, module, exports) {
		'use strict';

		var MicroEvent = require('microevent');

		var OP = {
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

		var OUTPUT = {
			CRT: 0
		};

		var SVC = {
			HALT: 11
		};

		var BIT_L = 4;
		var BIT_E = 2;
		var BIT_G = 1;

		var SP = 6;
		var FP = 7;

		function splitWord(word) {
			return [(word & 0xff << 24) >> 24, //op
			(word & 0x7 << 21) >> 21, //rj
			(word & 0x3 << 19) >> 19, //m
			(word & 0x7 << 16) >> 16, //ri
			word & 0xffff];
		}

		function Machine(settings) {
			this.settings = settings;

			this.memory = new Uint32Array(settings.memory);

			this.stdout = function (out) {
				;
			};

			this.lastPosition = 0;

			this.reset();
		}

		Machine.prototype = {
			_getValue: function _getValue(m, ri, addr) {
				var value = 0;

				if (ri === 0) value = addr;else value = this.reg[ri] + addr;

				if (m > 0) {
					value = this._getValue(--m, ri, this.memory[addr]);
				}

				return value;
			},

			load: function load(data) {
				var i = 0;
				for (; i < data.code.length; i++) {
					this.memory[i] = data.code[i];
				}

				for (var j = 0; j < data.symbols.length; j++) {
					this.memory[i + j] = data.data[j];
				}

				this.data = data;
			},

			getRegister: function getRegister() {
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

			getMemory: function getMemory() {
				return this.memory;
			},

			getRealLine: function getRealLine() {
				return this.data.lineMap[this.lastPosition];
			},


			stop: function stop() {
				this.ok = false;
			},

			setStdout: function setStdout(out) {
				this.stdout = out;
			},

			reset: function reset() {
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

			run: function run() {
				var loops = 0;

				while (this.isRunning() && loops < 100) {
					this.runWord();
					loops++;
				}
			},

			isRunning: function isRunning() {
				return this.ok && this.reg.PC < this.memory.length;
			},

			runWord: function runWord(count) {
				count = count || 1;

				for (var i = 0; i < count; i++) {
					this._runWord();
				}
			},

			_runWord: function _runWord() {
				var _splitWord = splitWord(this.memory[this.reg.PC]),
				    _splitWord2 = _slicedToArray(_splitWord, 5),
				    op = _splitWord2[0],
				    rj = _splitWord2[1],
				    m = _splitWord2[2],
				    ri = _splitWord2[3],
				    addr = _splitWord2[4];

				var value = this._getValue(m, ri, addr);

				this.lastPosition = this.reg.PC;
				this.reg.PC++;

				switch (op) {
					case OP.STORE:
						var oldValue = this.memory[addr];

						this.memory[addr] = this.reg[rj];

						if (this.settings.triggerMemoryChange && oldValue != this.memory[addr]) {
							this.trigger('memory-change', addr, oldValue, this.memory[addr]);
						}

						break;
					case OP.LOAD:
						this.reg[rj] = value;

						break;
					case OP.OUT:
						switch (addr) {
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
						switch (addr) {
							case SVC.HALT:
								this.ok = false;
								break;
						}
						break;
					case OP.COMP:
						this.SR = 0;

						if (this.reg[rj] == value) this.SR |= BIT_E;
						if (this.reg[rj] > value) this.SR |= BIT_G;
						if (this.reg[rj] < value) this.SR |= BIT_L;

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
						if (this.SR & BIT_E) this.reg.PC = this.memory[addr];

						break;
					case OP.JGRE:
						break;
					case OP.JNLES:
						break;
					case OP.JNEQU:
						if (!(this.SR & BIT_E)) this.reg.PC = this.memory[addr];

						break;
					case OP.JNGRE:
						break;
				}
			}
		};

		MicroEvent.mixin(Machine);

		module.exports = Machine;
	}, { "microevent": 1 }] }, {}, [3]);