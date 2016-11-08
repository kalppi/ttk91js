'use strict';

const util = require('util');

const common = require('./ttk91js.common.js');
const compile = require('./ttk91js.compile.js');
const Machine = require('./ttk91js.machine.js');

const OPS = Object.keys(common.OP);
const OPSV = {};

for(let op in common.OP) {
	OPSV[common.OP[op]] = op;
}

function wordToString(word) {
	let [op, rj, m, ri, addr] = common.splitWord(word);

	if(op === 0) {
		return 'NOP';
	}


	let ms = '';
	switch(m) {
		case common.MODE.IMMEDIATE:
			ms = '=';
			break;
		case common.MODE.INDIRECT:
			ms = '@';
			break;
	}

	if(op >= common.OP.JUMP && op <= common.OP.JNGRE) {
		return util.format('%s %d', OPSV[op], addr);
	} else {
		let rjs = 'R' + rj;
		if(rj == 6) rjs = 'SP';
		else if(rj == 7) rjs = 'FP';

		return util.format('%s %s, %s%s(R%s)', OPSV[op], rjs, ms, addr, ri);
	}
}

const debug = {
	word: function(word) {
		const s = ('0'.repeat(32) + (word >>> 0).toString(2)).slice(-32);
		console.log(s.substr(0, 8) + ' ' + s.substr(8, 3) + ' ' + s.substr(11, 2) + ' ' + s.substr(13, 3) + ' ' + s.substr(16));
	},
	bin: function(dec) {
		console.log(('0'.repeat(32) + (dec >>> 0).toString(2)).slice(-32));
	}
};


const ttk91js = {
	wordToString: wordToString,
	compile: compile,
	createMachine: function(settings) {
		return new Machine(settings);
	},
	debug: debug
};

if(typeof window == 'undefined') {
	module.exports = ttk91js;
} else {
	window.ttk91js = ttk91js;
}