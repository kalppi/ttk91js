var chai = require('chai');
var ttk91js = require('./ttk91js.js');

describe('Compile', function() {
	var data = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');

	describe('DC, LOAD, OUT', function() {
		it('Should have the right instruction bytes', function() {
			chai.expect(data.code).to.deep.equal([36175874, 69206016]);
		});

		it('Should have symbols y and x', function() {
			chai.expect(data.symbols).to.deep.equal(['y', 'X']);
		});

		it('Should have data 20, 10', function() {
			chai.expect(data.data).to.deep.equal([20, 10]);
		});
	});
});

describe('Machine', function() {
	var data = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');

	var memoryLimit = 7;

	var machine = ttk91js.createMachine(memoryLimit);
	machine.load(data);

	describe('memory', function() {
		var memory = machine.getMemory();

		it('Should have ' + memoryLimit + ' bytes of memory', function() {
			chai.expect(memory.length).to.equal(memoryLimit);
		});
		it('Should have the right memory layout', function() {
			chai.expect(Array.from(memory)).to.deep.equal([36175874, 69206016, 20, 10, 0, 0, 0]);
		});
	});
});
