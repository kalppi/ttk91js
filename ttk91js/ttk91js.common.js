

function splitWord(word) {
	return [
		(word & (0xff << 24)) >> 24,	//op
		(word & (0x7 << 21)) >> 21,		//rj
		(word & (0x3 << 19)) >> 19,		//m
		(word & (0x7 << 16)) >> 16,		//ri
		(word & 0xffff)					//addr
	];
}

module.exports = {
	splitWord: splitWord,
	OP: {
		NOP: 0,
		STORE: 1,
		LOAD: 2,
		IN: 3,
		OUT: 4,
		ADD: 17,
		SUB: 18,
		MUL: 19,
		DIV: 20,
		MOD: 21,
		AND: 22,
		OR: 23,
		XOR: 24,
		SHL: 25,
		SHR: 26,
		NOT: 27,
		SHRA: 28,
		COMP: 31,
		JUMP: 32,
		JNEG: 33,
		JZER: 34,
		JPOS: 35,
		JNNEG: 36,
		JNZER: 37,
		JNPOS: 38,
		JLES: 39,
		JEQU: 40,
		JGRE: 41,
		JNLES: 42,
		JNEQU: 43,
		JNGRE: 44,
		CALL: 49,
		EXIT: 50,
		PUSH: 51,
		POP: 52,
		PUSHR: 53,
		POPR: 54,
		SVC: 112
	},
	MODE: {
		IMMEDIATE: 0,
		DIRECT: 1,
		INDIRECT: 2
	},
	SR_BITS: {
		G: 1,
		E: 2,
		L: 4,
		OVERFLOW: 8,
		DIVIDE_BY_ZERO: 16,
		UNKNOWN_INSTRUCTION: 32,
		FORBIDDED_MEMORY_ADRESS: 64,
		DEVICE_INTERRUPT: 128,
		SVC: 256,
		PRIVILEGED: 512,
		INTERRUPTS_DISABLED: 1024
	}
};