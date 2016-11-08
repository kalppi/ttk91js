'use strict';

var util = require('util');

var global = require('./ttk91js.global.js');
var compile = require('./ttk91js.compile.js');
var Machine = require('./ttk91js.machine.js');

var OPS = Object.keys(global.OP);
var OPSV = {};

for(let op in global.OP) {
	OPSV[global.OP[op]] = op;
}

function wordToString(word) {
	let [op, rj, m, ri, addr] = global.splitWord(word);

	if(op === 0) {
		return 'NOP';
	}


	var ms = '';
	switch(m) {
		case global.MODE.IMMEDIATE:
			ms = '=';
			break;
		case global.MODE.INDIRECT:
			ms = '@';
			break;
	}

	if(op >= global.OP.JUMP && op <= global.OP.JNGRE) {
		return util.format('%s %d', OPSV[op], addr);
	} else {
		let rjs = 'R' + rj;
		if(rj == 6) rjs = 'SP';
		else if(rj == 7) rjs = 'FP';

		return util.format('%s %s, %s%s(R%s)', OPSV[op], rjs, ms, addr, ri);
	}
}

var debug = {
	word: function(word) {
		var s = ('0'.repeat(32) + (word >>> 0).toString(2)).slice(-32);
		console.log(s.substr(0, 8) + ' ' + s.substr(8, 3) + ' ' + s.substr(11, 2) + ' ' + s.substr(13, 3) + ' ' + s.substr(16));
	},
	bin: function(dec) {
		console.log(('0'.repeat(32) + (dec >>> 0).toString(2)).slice(-32));
	}
};


var ttk91js = {
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