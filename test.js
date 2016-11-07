// jshint ignore: start

'use strict';

var chai = require('chai');
var ttk91js = require('./ttk91js.js');

var expect = chai.expect;

describe('Misc', () => {
	describe('wordToString', () => {
		it('NOP', () => {
			expect(ttk91js.wordToString(0)).to.be.equal('NOP');
		});
		it('LOAD', () => {
			expect(ttk91js.wordToString(35652472)).to.be.equal('LOAD R1, =888(R0)');
		});
		it('ADD', () => {
			expect(ttk91js.wordToString(287440896)).to.be.equal('ADD R1, =0(R2)');
		});
		it('JUMP', () => {
			expect(ttk91js.wordToString(536870912)).to.be.equal('JUMP 0');
		});
	})
});

describe('Compile', function() {
	describe('Misc', () => {
		it('Empty', () => {
			let data = ttk91js.compile('');

			expect(data.data).to.deep.equal([]);
		});
	});

	describe('NOP, DC, LOAD, OUT', function() {
		let data = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nNOP\nOUT R1, =CRT\n');

		it('Instruction bytes', function() {
			expect(data.code).to.deep.equal([36175875, 524288, 69206016]);
		});

		it('Symbols', function() {
			expect(data.symbols[0].name).to.equal('y');
			expect(data.symbols[1].name).to.equal('X');
		});

		it('Data', function() {
			expect(data.data).to.deep.equal([20, 10]);
		});
	});

	describe('Error handling', () => {
		let exceptions = {
			opcode: [
				'x DEC 20',
				'LAUD R1, =5'
			],
			register: [
				'LOAD R9, =5',

			],
			symbol: [
				'STORE R1, x',
				'LOAD R1, x'
			],
			argcount: [
				'STORE R1',
				'LOAD R1'
			]
		};

		let linenumbers = {
			'y DC 10\nx DEC 20': 1,
			'z DC 1\n\nLOAD R1, =1\nLOAD R2, =2\nLOAD R9, =5': 4,
			'x DC 1\ny DC 2\nLOAD R1, =3\n\nSTORE R1, z': 4

		};

		describe('Exceptions', () => {
			for(let type in exceptions) {
				describe('Invalid ' + type, () => {
					for(let c of exceptions[type]) {
						it(c, () => {
							expect(ttk91js.compile.bind(ttk91js, c)).to.throw(type);
						});
					}
				});
			}
		});
		
		describe('Exception line numbers', () => {
			for(let c in linenumbers) {
				it('line should be ' + linenumbers[c], (done) => {
					try {
						ttk91js.compile(c);
					} catch(e) {
						expect(e.line).to.equal(linenumbers[c]);
						done();
					}
				});
			}
		});

		describe('Invalid syntax', () => {
			var code = [
				'STORE R1 x',
				'LOAD R1, =0(R1',
				'LOAD R1,',
				'LOAD R1, ='
			];

			for(let c of code) {
				it(c, () => {
					expect(() => {
						ttk91js.compile(c);
					}).to.throw('syntax');
				});
			}
		});
	});
});

describe('Machine', function() {
	let memoryLimit = 7;

	describe('Memory', function() {
		let machine1 = ttk91js.createMachine({memory: memoryLimit});
		let data1 = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');
		machine1.load(data1);

		let memory = machine1.getMemory();

		it('Amount of memory', function() {
			expect(memory.length).to.equal(memoryLimit);
		});
		it('Memory layout', function() {
			expect(Array.from(memory)).to.deep.equal(
				[36175874, 69206016, 20, 10, 0, 0, 0]
			);
		});

		let machine2 = ttk91js.createMachine({memory: memoryLimit});
		let data2 = ttk91js.compile('x DC 10\nLOAD R1, =50\nLOAD R2, =60\nSTORE R1, x\nSTORE R2, x');
		machine2.load(data2);

		it('Memory layout after 4 steps', function() {
			machine2.runWord(4);

			let memory = machine2.getMemory();

			expect(memory[4]).to.equal(60);
		});
	});

	describe('Error handling', () => {
		describe('Exceptions', () => {
			it('access outside of program memory', () => {
				let machine = ttk91js.createMachine({memory: memoryLimit});

				expect(machine.getMemoryAt.bind(machine, -1)).to.throw('access');
				expect(machine.getMemoryAt.bind(machine, memoryLimit)).to.throw('access');
			});
		});
	});

	describe('Triggers', function() {
		it('memory-write', (done) => {
			let machine = ttk91js.createMachine({
				memory: memoryLimit,
				triggerMemoryWrite: true
			});

			let data = ttk91js.compile('x DC 1\nLOAD R1, =2\nSTORE R1, x\nSVC SP, =CRT');

			machine.load(data);

			machine.bind('memory-write', (addr, oldValue, newValue) => {
				expect(oldValue).to.equal(1);
				expect(newValue).to.equal(2);
				expect(addr).to.equal(3);

				done();
			});

			machine.run();
		});

		it('register-write', (done) => {
			let machine = ttk91js.createMachine({
				memory: memoryLimit,
				triggerRegisterWrite: true
			});

			let data = ttk91js.compile('LOAD R3, =2');

			machine.load(data);

			machine.bind('register-write', (addr, oldValue, newValue) => {
				expect(oldValue).to.be.equal(0);
				expect(newValue).to.be.equal(2);
				expect(addr).to.be.equal(3);

				done();
			});

			machine.run();
		});
	});

	describe('Stdout', () => {
		let machine = ttk91js.createMachine({
			memory: memoryLimit,
		});

		let data = ttk91js.compile('LOAD R1, =123\nOUT R1, =CRT');

		machine.load(data);

		it('redirect', (done) => {
			machine.setStdout({
				write: function(out) {
					expect(out).to.be.equal(123);

					done();
				}
			});

			machine.run();
		})
	})
});