var chai = require('chai');

var ttk91js = require('./ttk91js.js');

var data = ttk91js.compile('y DC 20\nx DC 10\nLOAD R1, y\nOUT R1, =CRT\n');

describe('Compile', function() {
	describe('DC, LOAD, OUT', function() {
		it('Should have right bytes', function() {
			chai.expect(data.code).to.deep.equal([36175874, 69206016]);
		});

		it('Should have right symbols', function() {
			chai.expect(data.symbols).to.deep.equal(['y', 'x']);
		});

		it('Should have right data', function() {
			chai.expect(data.data).to.deep.equal([20, 10]);
		});
	});

});



return;

var machine = ttk91js.createMachine(10);
machine.load(data);



machine.run();

var assert = require('assert');

describe('Compile', function() {
  describe('getMemory', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});