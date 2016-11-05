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
	var memoryLimit = 7;	

	describe('memory', function() {
		var machine1 = ttk91js.createMachine({memory: memoryLimit});
		var data1 = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');
		machine1.load(data1);

		var memory = machine1.getMemory();

		it('Amount of memory', function() {
			chai.expect(memory.length).to.equal(memoryLimit);
		});
		it('Memory layout', function() {
			chai.expect(Array.from(memory)).to.deep.equal([36175874, 69206016, 20, 10, 0, 0, 0]);
		});

		var machine2 = ttk91js.createMachine({memory: memoryLimit});
		var data2 = ttk91js.compile('x DC 10\nLOAD R1, =50\nLOAD R2, =60\nSTORE R1, x\nSTORE R2, x');
		machine2.load(data2);

		it('Memory layout after steps', function() {
			machine2.runWord(4);

			var memory = machine2.getMemory();

			chai.expect(memory[4]).to.equal(60);
		});
	});
});
