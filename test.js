
var ttk91js = require('./ttk91js.js');

var data = ttk91js.compile('y DC 20\nx DC 10\nLOAD R1, y\nOUT R1, =CRT\n');
var machine = ttk91js.createMachine(10);
machine.load(data);

console.log(machine.getMemory());

machine.run();