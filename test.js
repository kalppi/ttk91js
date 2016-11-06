// jshint ignore: start

'use strict';

var chai = require('chai');
var ttk91js = require('./ttk91js.js');

describe('Compile', function() {
	var data = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');

	describe('DC, LOAD, OUT', function() {
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
		it('memory-change', (done) => {
			let machine = ttk91js.createMachine({
				memory: memoryLimit,
				triggerMemoryChange: true
			});

			let data = ttk91js.compile('x DC 1\nLOAD R1, =2\nSTORE R1, x\nSVC SP, =CRT');

			machine.load(data);

			machine.bind('memory-change', (addr, oldValue, newValue) => {
				chai.expect(oldValue).to.equal(1);
				chai.expect(newValue).to.equal(2);
				chai.expect(addr).to.equal(3);

				done();
			});

			machine.run();
		});

		it('register-change', (done) => {
			let machine = ttk91js.createMachine({
				memory: memoryLimit,
				triggerRegisterChange: true
			});

			let data = ttk91js.compile('LOAD R3, =2');

			machine.load(data);

			machine.bind('register-change', (addr, oldValue, newValue) => {
				chai.expect(oldValue).to.be.equal(0);
				chai.expect(newValue).to.be.equal(2);
				chai.expect(addr).to.be.equal(3);

				done();
			});

			machine.run();
		});
		
	});
});