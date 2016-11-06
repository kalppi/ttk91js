// jshint ignore: start

'use strict';

var chai = require('chai');
var ttk91js = require('./ttk91js.js');

describe('Compile', function() {
	describe('DC, LOAD, OUT', function() {
		let data = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');

		it('Instruction bytes', function() {
			chai.expect(data.code).to.deep.equal([36175874, 69206016]);
		});

		it('Symbols', function() {
			chai.expect(data.symbols).to.deep.equal(['y', 'X']);
		});

		it('Data', function() {
			chai.expect(data.data).to.deep.equal([20, 10]);
		});
	});

	describe('error handling', () => {
		it('Invalid op-code', () => {
			chai.expect(() => {
				ttk91js.compile('x DEC 20');
			}).to.throw('opcode');

			chai.expect(() => {
				ttk91js.compile('LAUD R1, =5');
			}).to.throw('opcode');
		});

		it('Invalid register', () => {
			chai.expect(() => {
				ttk91js.compile('LOAD R9, =5');
			}).to.throw('register');
		});

		it('Invalid symbol', () => {
			chai.expect(() => {
				ttk91js.compile('STORE R1, x');
			}).to.throw('symbol');

			chai.expect(() => {
				ttk91js.compile('LOAD R1, x');
			}).to.throw('symbol');
		});

		it('Invalid syntax', () => {
			chai.expect(() => {
				ttk91js.compile('STORE R1 x');
			}).to.throw('syntax');

			chai.expect(() => {
				ttk91js.compile('LOAD R1, =0(R1');
			}).to.throw('syntax');
		});
	});
});

describe('Machine', function() {
	let memoryLimit = 7;

	describe('memory', function() {
		let machine1 = ttk91js.createMachine({memory: memoryLimit});
		let data1 = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');
		machine1.load(data1);

		let memory = machine1.getMemory();

		it('Amount of memory', function() {
			chai.expect(memory.length).to.equal(memoryLimit);
		});
		it('Memory layout', function() {
			chai.expect(Array.from(memory)).to.deep.equal(
				[36175874, 69206016, 20, 10, 0, 0, 0]
			);
		});

		let machine2 = ttk91js.createMachine({memory: memoryLimit});
		let data2 = ttk91js.compile('x DC 10\nLOAD R1, =50\nLOAD R2, =60\nSTORE R1, x\nSTORE R2, x');
		machine2.load(data2);

		it('Memory layout after 4 steps', function() {
			machine2.runWord(4);

			let memory = machine2.getMemory();

			chai.expect(memory[4]).to.equal(60);
		});
	});

	describe('triggers', function() {
		it('memory-write', (done) => {
			let machine = ttk91js.createMachine({
				memory: memoryLimit,
				triggerMemoryWrite: true
			});

			let data = ttk91js.compile('x DC 1\nLOAD R1, =2\nSTORE R1, x\nSVC SP, =CRT');

			machine.load(data);

			machine.bind('memory-write', (addr, oldValue, newValue) => {
				chai.expect(oldValue).to.equal(1);
				chai.expect(newValue).to.equal(2);
				chai.expect(addr).to.equal(3);

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
				chai.expect(oldValue).to.be.equal(0);
				chai.expect(newValue).to.be.equal(2);
				chai.expect(addr).to.be.equal(3);

				done();
			});

			machine.run();
		});
	});

	describe('stdout', () => {
		let machine = ttk91js.createMachine({
			memory: memoryLimit,
		});

		let data = ttk91js.compile('LOAD R1, =123\nOUT R1, =CRT');

		machine.load(data);

		it('redirect', (done) => {
			machine.setStdout({
				write: function(out) {
					chai.expect(out).to.be.equal(123);

					done();
				}
			});

			machine.run();
		})
	})
});