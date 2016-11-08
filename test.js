// jshint ignore: start

'use strict';

var chai = require('chai');
var ttk91js = require('./ttk91js/ttk91js.js');

var expect = chai.expect;

/*const testProgram = ttk91js.compile('aaa222 LOAD R1,=1\nLOAD R2,aaa222');
const testMachine = ttk91js.createMachine({memory: 10});
testMachine.load(testProgram);

return;*/

describe('Compile', function() {
	describe('Misc', () => {
		it('Empty', () => {
			let data = ttk91js.compile('');

			expect(data.data).to.deep.equal([]);
		});
	});

	describe('Addressing', () => {
		it('Immediate', function() {
			let data1 = ttk91js.compile('z DC 2222\nx DC 1111\nLOAD R1, =x');
			expect(data1.code).to.deep.equal([35651586]);

			let data2 = ttk91js.compile('x DS 2\nLOAD R1, =x');
			expect(data2.code).to.deep.equal([35651585]);

			let data3 = ttk91js.compile('LOAD R4, =100');
			expect(data3.code).to.deep.equal([41943140]);
		});

		it('Direct', function() {
			let data1 = ttk91js.compile('z DC 2222\nx DC 1111\nLOAD R1, x');
			expect(data1.code).to.deep.equal([36175874]);

			let data2 = ttk91js.compile('x DS 2\nLOAD R1, x');
			expect(data2.code).to.deep.equal([36175873]);

			let data3 = ttk91js.compile('STORE R2, 0(R1)');
			expect(data3.code).to.deep.equal([21037056]);

			let data4 = ttk91js.compile('LOAD R4, 500');
			expect(data4.code).to.deep.equal([42467828]);
		});

		it('Indirect', function() {
			let data1 = ttk91js.compile('z DC 2222\nx DC 1111\nLOAD R1, @x');
			expect(data1.code).to.deep.equal([36700162]);

			let data2 = ttk91js.compile('x DS 2\nLOAD R1, @x');
			expect(data2.code).to.deep.equal([36700161]);
		});

	});

	describe('EQU, DC, DS', () => {
		it('Symbol table', () => {
			let data = ttk91js.compile('x EQU 1\ny DS 3\nz DC 3\n');
			var machine = ttk91js.createMachine({memory: 5});
			machine.load(data);

			let memory = machine.getMemory();

			expect(Array.from(memory.getAll())).to.deep.equal(
				[0, 0, 0, 3, 0]
			);
		});
	});

	describe('Error handling', () => {
		let exceptions = {
			opcode: [
				'x DEC 20',
				'LAUD R1, =5',
				'S'
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
				'LOAD R1',
				'STORE'
			],
			syntax: [
				'STORE R1 x',
				'LOAD R1, =0(R1',
				'LOAD R1,',
				'LOAD R1, ='
			]
		};

		let linenumbers = {
			'y DC 10\nx DEC 20': 1,
			'z DC 1\n\nLOAD R1, =1\nLOAD R2, =2\nLOAD R9, =5': 4,
			'x DC 1\ny DC 2\nLOAD R1, =3\n\nSTORE R1, z': 4

		};

		describe('Compile exceptions', () => {
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
			let i = 0;
			for(let c in linenumbers) {
				it(String.fromCharCode(65+i), (done) => {
					try {
						ttk91js.compile(c);
					} catch(e) {
						expect(e.line).to.equal(linenumbers[c]);
						done();
					}
				});
				i++;
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
			expect(memory.size()).to.equal(memoryLimit);
		});
		it('Memory layout', function() {
			expect(Array.from(memory.getAll())).to.deep.equal(
				[36175874, 69206016, 20, 10, 0, 0, 0]
			);
		});

		let machine2 = ttk91js.createMachine({memory: memoryLimit});
		let data2 = ttk91js.compile('x DC 10\nLOAD R1, =50\nLOAD R2, =60\nSTORE R1, x\nSTORE R2, x');
		machine2.load(data2);

		it('Memory layout after 4 steps', function() {
			machine2.runWord(4);

			let memory = machine2.getMemory();

			expect(memory.getAt(4)).to.equal(60);
		});
	});

	describe('Error handling', () => {
		describe('Runtime exceptions', () => {
			it('access outside of program memory', () => {
				let machine = ttk91js.createMachine({memory: memoryLimit});

				expect(machine.memory.getAt.bind(machine.memory, -1)).to.throw('access');
				expect(machine.memory.getAt.bind(machine.memory, memoryLimit)).to.throw('access');
			});

			it('access outside of program line number', (done) => {
				let machine = ttk91js.createMachine({memory: memoryLimit});
				let data = ttk91js.compile('x DC 1\nLOAD R1, =111\nLOAD R2, =222\nLOAD R3, 333');
				machine.load(data);

				try {
					machine.run();
				} catch(e) {
					expect(e.line).to.equal(2);
					done();
				}
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

describe('Misc', () => {
	describe('wordToSymbolic', () => {
		it('NOP', () => {
			expect(ttk91js.wordToSymbolic(0)).to.be.equal('NOP');
		});
		it('LOAD', () => {
			expect(ttk91js.wordToSymbolic(35652472)).to.be.equal('LOAD R1, =888(R0)');
		});
		it('ADD', () => {
			expect(ttk91js.wordToSymbolic(287440896)).to.be.equal('ADD R1, =0(R2)');
		});
		it('JUMP', () => {
			expect(ttk91js.wordToSymbolic(536870912)).to.be.equal('JUMP 0');
		});
	})
});
