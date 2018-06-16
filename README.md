# ttk91js

Can be used as a node module, and also in browser with included distributions.

## Example
```js
const ttk91js = require('ttk91js');

const data = ttk91js.compile('y DC 20\nX DC 10\nLOAD R1, y\nOUT R1, =CRT\n');

const machine = ttk91js.createMachine({memory: 512});
machine.load(data);
machine.run();
```
