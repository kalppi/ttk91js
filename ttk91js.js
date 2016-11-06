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
	if(word === 0) {
		return 'NOP';
	}

	let [op, rj, m, ri, addr] = global.splitWord(word);

	var ms = '';
	switch(m) {
		case global.MODE.IMMEDIATE:
			ms = '=';
			break;
		case global.MODE.INDIRECT:
			ms = '@';
			break;
	}

	return util.format('%s R%d, %s%s(R%s)', OPSV[op], rj, ms, addr, ri);
}

var ttk91js = {
	wordToString: wordToString,
	compile: compile,
	createMachine: function(settings) {
		return new Machine(settings);
	}
};

if(typeof window == 'undefined') {
	module.exports = ttk91js;
} else {
	window.ttk91js = ttk91js;
}