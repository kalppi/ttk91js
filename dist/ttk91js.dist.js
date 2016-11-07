"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
			}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];return s(n ? n : e);
			}, l, l.exports, e, t, n, r);
		}return n[o].exports;
	}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
		s(r[o]);
	}return s;
})({ 1: [function (require, module, exports) {
		/**
   * MicroEvent - to make any js object an event emitter (server or browser)
   * 
   * - pure javascript - server compatible, browser compatible
   * - dont rely on the browser doms
   * - super simple - you get it immediatly, no mistery, no magic involved
   *
   * - create a MicroEventDebug with goodies to debug
   *   - make it safer to use
  */

		var MicroEvent = function MicroEvent() {};
		MicroEvent.prototype = {
			bind: function bind(event, fct) {
				this._events = this._events || {};
				this._events[event] = this._events[event] || [];
				this._events[event].push(fct);
			},
			unbind: function unbind(event, fct) {
				this._events = this._events || {};
				if (event in this._events === false) return;
				this._events[event].splice(this._events[event].indexOf(fct), 1);
			},
			trigger: function trigger(event /* , args... */) {
				this._events = this._events || {};
				if (event in this._events === false) return;
				for (var i = 0; i < this._events[event].length; i++) {
					this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
				}
			}
		};

		/**
   * mixin will delegate all MicroEvent.js function in the destination object
   *
   * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
   *
   * @param {Object} the object which will support MicroEvent
  */
		MicroEvent.mixin = function (destObject) {
			var props = ['bind', 'unbind', 'trigger'];
			for (var i = 0; i < props.length; i++) {
				destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
			}
		};

		// export in common js
		if (typeof module !== "undefined" && 'exports' in module) {
			module.exports = MicroEvent;
		}
	}, {}], 2: [function (require, module, exports) {
		// shim for using process in browser
		var process = module.exports = {};

		// cached from whatever global is present so that test runners that stub it
		// don't break things.  But we need to wrap it in a try catch in case it is
		// wrapped in strict mode code which doesn't define any globals.  It's inside a
		// function because try/catches deoptimize in certain engines.

		var cachedSetTimeout;
		var cachedClearTimeout;

		function defaultSetTimout() {
			throw new Error('setTimeout has not been defined');
		}
		function defaultClearTimeout() {
			throw new Error('clearTimeout has not been defined');
		}
		(function () {
			try {
				if (typeof setTimeout === 'function') {
					cachedSetTimeout = setTimeout;
				} else {
					cachedSetTimeout = defaultSetTimout;
				}
			} catch (e) {
				cachedSetTimeout = defaultSetTimout;
			}
			try {
				if (typeof clearTimeout === 'function') {
					cachedClearTimeout = clearTimeout;
				} else {
					cachedClearTimeout = defaultClearTimeout;
				}
			} catch (e) {
				cachedClearTimeout = defaultClearTimeout;
			}
		})();
		function runTimeout(fun) {
			if (cachedSetTimeout === setTimeout) {
				//normal enviroments in sane situations
				return setTimeout(fun, 0);
			}
			// if setTimeout wasn't available but was latter defined
			if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
				cachedSetTimeout = setTimeout;
				return setTimeout(fun, 0);
			}
			try {
				// when when somebody has screwed with setTimeout but no I.E. maddness
				return cachedSetTimeout(fun, 0);
			} catch (e) {
				try {
					// When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
					return cachedSetTimeout.call(null, fun, 0);
				} catch (e) {
					// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
					return cachedSetTimeout.call(this, fun, 0);
				}
			}
		}
		function runClearTimeout(marker) {
			if (cachedClearTimeout === clearTimeout) {
				//normal enviroments in sane situations
				return clearTimeout(marker);
			}
			// if clearTimeout wasn't available but was latter defined
			if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
				cachedClearTimeout = clearTimeout;
				return clearTimeout(marker);
			}
			try {
				// when when somebody has screwed with setTimeout but no I.E. maddness
				return cachedClearTimeout(marker);
			} catch (e) {
				try {
					// When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
					return cachedClearTimeout.call(null, marker);
				} catch (e) {
					// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
					// Some versions of I.E. have different rules for clearTimeout vs setTimeout
					return cachedClearTimeout.call(this, marker);
				}
			}
		}
		var queue = [];
		var draining = false;
		var currentQueue;
		var queueIndex = -1;

		function cleanUpNextTick() {
			if (!draining || !currentQueue) {
				return;
			}
			draining = false;
			if (currentQueue.length) {
				queue = currentQueue.concat(queue);
			} else {
				queueIndex = -1;
			}
			if (queue.length) {
				drainQueue();
			}
		}

		function drainQueue() {
			if (draining) {
				return;
			}
			var timeout = runTimeout(cleanUpNextTick);
			draining = true;

			var len = queue.length;
			while (len) {
				currentQueue = queue;
				queue = [];
				while (++queueIndex < len) {
					if (currentQueue) {
						currentQueue[queueIndex].run();
					}
				}
				queueIndex = -1;
				len = queue.length;
			}
			currentQueue = null;
			draining = false;
			runClearTimeout(timeout);
		}

		process.nextTick = function (fun) {
			var args = new Array(arguments.length - 1);
			if (arguments.length > 1) {
				for (var i = 1; i < arguments.length; i++) {
					args[i - 1] = arguments[i];
				}
			}
			queue.push(new Item(fun, args));
			if (queue.length === 1 && !draining) {
				runTimeout(drainQueue);
			}
		};

		// v8 likes predictible objects
		function Item(fun, array) {
			this.fun = fun;
			this.array = array;
		}
		Item.prototype.run = function () {
			this.fun.apply(null, this.array);
		};
		process.title = 'browser';
		process.browser = true;
		process.env = {};
		process.argv = [];
		process.version = ''; // empty string to avoid regexp issues
		process.versions = {};

		function noop() {}

		process.on = noop;
		process.addListener = noop;
		process.once = noop;
		process.off = noop;
		process.removeListener = noop;
		process.removeAllListeners = noop;
		process.emit = noop;

		process.binding = function (name) {
			throw new Error('process.binding is not supported');
		};

		process.cwd = function () {
			return '/';
		};
		process.chdir = function (dir) {
			throw new Error('process.chdir is not supported');
		};
		process.umask = function () {
			return 0;
		};
	}, {}], 3: [function (require, module, exports) {
		if (typeof Object.create === 'function') {
			// implementation from standard node.js 'util' module
			module.exports = function inherits(ctor, superCtor) {
				ctor.super_ = superCtor;
				ctor.prototype = Object.create(superCtor.prototype, {
					constructor: {
						value: ctor,
						enumerable: false,
						writable: true,
						configurable: true
					}
				});
			};
		} else {
			// old school shim for old browsers
			module.exports = function inherits(ctor, superCtor) {
				ctor.super_ = superCtor;
				var TempCtor = function TempCtor() {};
				TempCtor.prototype = superCtor.prototype;
				ctor.prototype = new TempCtor();
				ctor.prototype.constructor = ctor;
			};
		}
	}, {}], 4: [function (require, module, exports) {
		module.exports = function isBuffer(arg) {
			return arg && (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
		};
	}, {}], 5: [function (require, module, exports) {
		(function (process, global) {
			// Copyright Joyent, Inc. and other Node contributors.
			//
			// Permission is hereby granted, free of charge, to any person obtaining a
			// copy of this software and associated documentation files (the
			// "Software"), to deal in the Software without restriction, including
			// without limitation the rights to use, copy, modify, merge, publish,
			// distribute, sublicense, and/or sell copies of the Software, and to permit
			// persons to whom the Software is furnished to do so, subject to the
			// following conditions:
			//
			// The above copyright notice and this permission notice shall be included
			// in all copies or substantial portions of the Software.
			//
			// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
			// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
			// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
			// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
			// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
			// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
			// USE OR OTHER DEALINGS IN THE SOFTWARE.

			var formatRegExp = /%[sdj%]/g;
			exports.format = function (f) {
				if (!isString(f)) {
					var objects = [];
					for (var i = 0; i < arguments.length; i++) {
						objects.push(inspect(arguments[i]));
					}
					return objects.join(' ');
				}

				var i = 1;
				var args = arguments;
				var len = args.length;
				var str = String(f).replace(formatRegExp, function (x) {
					if (x === '%%') return '%';
					if (i >= len) return x;
					switch (x) {
						case '%s':
							return String(args[i++]);
						case '%d':
							return Number(args[i++]);
						case '%j':
							try {
								return JSON.stringify(args[i++]);
							} catch (_) {
								return '[Circular]';
							}
						default:
							return x;
					}
				});
				for (var x = args[i]; i < len; x = args[++i]) {
					if (isNull(x) || !isObject(x)) {
						str += ' ' + x;
					} else {
						str += ' ' + inspect(x);
					}
				}
				return str;
			};

			// Mark that a method should not be used.
			// Returns a modified function which warns once by default.
			// If --no-deprecation is set, then it is a no-op.
			exports.deprecate = function (fn, msg) {
				// Allow for deprecating things in the process of starting up.
				if (isUndefined(global.process)) {
					return function () {
						return exports.deprecate(fn, msg).apply(this, arguments);
					};
				}

				if (process.noDeprecation === true) {
					return fn;
				}

				var warned = false;
				function deprecated() {
					if (!warned) {
						if (process.throwDeprecation) {
							throw new Error(msg);
						} else if (process.traceDeprecation) {
							console.trace(msg);
						} else {
							console.error(msg);
						}
						warned = true;
					}
					return fn.apply(this, arguments);
				}

				return deprecated;
			};

			var debugs = {};
			var debugEnviron;
			exports.debuglog = function (set) {
				if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
				set = set.toUpperCase();
				if (!debugs[set]) {
					if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
						var pid = process.pid;
						debugs[set] = function () {
							var msg = exports.format.apply(exports, arguments);
							console.error('%s %d: %s', set, pid, msg);
						};
					} else {
						debugs[set] = function () {};
					}
				}
				return debugs[set];
			};

			/**
    * Echos the value of a value. Trys to print the value out
    * in the best way possible given the different types.
    *
    * @param {Object} obj The object to print out.
    * @param {Object} opts Optional options object that alters the output.
    */
			/* legacy: obj, showHidden, depth, colors*/
			function inspect(obj, opts) {
				// default options
				var ctx = {
					seen: [],
					stylize: stylizeNoColor
				};
				// legacy...
				if (arguments.length >= 3) ctx.depth = arguments[2];
				if (arguments.length >= 4) ctx.colors = arguments[3];
				if (isBoolean(opts)) {
					// legacy...
					ctx.showHidden = opts;
				} else if (opts) {
					// got an "options" object
					exports._extend(ctx, opts);
				}
				// set default options
				if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
				if (isUndefined(ctx.depth)) ctx.depth = 2;
				if (isUndefined(ctx.colors)) ctx.colors = false;
				if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
				if (ctx.colors) ctx.stylize = stylizeWithColor;
				return formatValue(ctx, obj, ctx.depth);
			}
			exports.inspect = inspect;

			// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
			inspect.colors = {
				'bold': [1, 22],
				'italic': [3, 23],
				'underline': [4, 24],
				'inverse': [7, 27],
				'white': [37, 39],
				'grey': [90, 39],
				'black': [30, 39],
				'blue': [34, 39],
				'cyan': [36, 39],
				'green': [32, 39],
				'magenta': [35, 39],
				'red': [31, 39],
				'yellow': [33, 39]
			};

			// Don't use 'blue' not visible on cmd.exe
			inspect.styles = {
				'special': 'cyan',
				'number': 'yellow',
				'boolean': 'yellow',
				'undefined': 'grey',
				'null': 'bold',
				'string': 'green',
				'date': 'magenta',
				// "name": intentionally not styling
				'regexp': 'red'
			};

			function stylizeWithColor(str, styleType) {
				var style = inspect.styles[styleType];

				if (style) {
					return "\x1B[" + inspect.colors[style][0] + 'm' + str + "\x1B[" + inspect.colors[style][1] + 'm';
				} else {
					return str;
				}
			}

			function stylizeNoColor(str, styleType) {
				return str;
			}

			function arrayToHash(array) {
				var hash = {};

				array.forEach(function (val, idx) {
					hash[val] = true;
				});

				return hash;
			}

			function formatValue(ctx, value, recurseTimes) {
				// Provide a hook for user-specified inspect functions.
				// Check that value is an object with an inspect function on it
				if (ctx.customInspect && value && isFunction(value.inspect) &&
				// Filter out the util module, it's inspect function is special
				value.inspect !== exports.inspect &&
				// Also filter out any prototype objects using the circular check.
				!(value.constructor && value.constructor.prototype === value)) {
					var ret = value.inspect(recurseTimes, ctx);
					if (!isString(ret)) {
						ret = formatValue(ctx, ret, recurseTimes);
					}
					return ret;
				}

				// Primitive types cannot have properties
				var primitive = formatPrimitive(ctx, value);
				if (primitive) {
					return primitive;
				}

				// Look up the keys of the object.
				var keys = Object.keys(value);
				var visibleKeys = arrayToHash(keys);

				if (ctx.showHidden) {
					keys = Object.getOwnPropertyNames(value);
				}

				// IE doesn't make error fields non-enumerable
				// http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
				if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
					return formatError(value);
				}

				// Some type of object without properties can be shortcutted.
				if (keys.length === 0) {
					if (isFunction(value)) {
						var name = value.name ? ': ' + value.name : '';
						return ctx.stylize('[Function' + name + ']', 'special');
					}
					if (isRegExp(value)) {
						return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
					}
					if (isDate(value)) {
						return ctx.stylize(Date.prototype.toString.call(value), 'date');
					}
					if (isError(value)) {
						return formatError(value);
					}
				}

				var base = '',
				    array = false,
				    braces = ['{', '}'];

				// Make Array say that they are Array
				if (isArray(value)) {
					array = true;
					braces = ['[', ']'];
				}

				// Make functions say that they are functions
				if (isFunction(value)) {
					var n = value.name ? ': ' + value.name : '';
					base = ' [Function' + n + ']';
				}

				// Make RegExps say that they are RegExps
				if (isRegExp(value)) {
					base = ' ' + RegExp.prototype.toString.call(value);
				}

				// Make dates with properties first say the date
				if (isDate(value)) {
					base = ' ' + Date.prototype.toUTCString.call(value);
				}

				// Make error with message first say the error
				if (isError(value)) {
					base = ' ' + formatError(value);
				}

				if (keys.length === 0 && (!array || value.length == 0)) {
					return braces[0] + base + braces[1];
				}

				if (recurseTimes < 0) {
					if (isRegExp(value)) {
						return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
					} else {
						return ctx.stylize('[Object]', 'special');
					}
				}

				ctx.seen.push(value);

				var output;
				if (array) {
					output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
				} else {
					output = keys.map(function (key) {
						return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
					});
				}

				ctx.seen.pop();

				return reduceToSingleString(output, base, braces);
			}

			function formatPrimitive(ctx, value) {
				if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
				if (isString(value)) {
					var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
					return ctx.stylize(simple, 'string');
				}
				if (isNumber(value)) return ctx.stylize('' + value, 'number');
				if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
				// For some reason typeof null is "object", so special case here.
				if (isNull(value)) return ctx.stylize('null', 'null');
			}

			function formatError(value) {
				return '[' + Error.prototype.toString.call(value) + ']';
			}

			function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
				var output = [];
				for (var i = 0, l = value.length; i < l; ++i) {
					if (hasOwnProperty(value, String(i))) {
						output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
					} else {
						output.push('');
					}
				}
				keys.forEach(function (key) {
					if (!key.match(/^\d+$/)) {
						output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
					}
				});
				return output;
			}

			function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
				var name, str, desc;
				desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
				if (desc.get) {
					if (desc.set) {
						str = ctx.stylize('[Getter/Setter]', 'special');
					} else {
						str = ctx.stylize('[Getter]', 'special');
					}
				} else {
					if (desc.set) {
						str = ctx.stylize('[Setter]', 'special');
					}
				}
				if (!hasOwnProperty(visibleKeys, key)) {
					name = '[' + key + ']';
				}
				if (!str) {
					if (ctx.seen.indexOf(desc.value) < 0) {
						if (isNull(recurseTimes)) {
							str = formatValue(ctx, desc.value, null);
						} else {
							str = formatValue(ctx, desc.value, recurseTimes - 1);
						}
						if (str.indexOf('\n') > -1) {
							if (array) {
								str = str.split('\n').map(function (line) {
									return '  ' + line;
								}).join('\n').substr(2);
							} else {
								str = '\n' + str.split('\n').map(function (line) {
									return '   ' + line;
								}).join('\n');
							}
						}
					} else {
						str = ctx.stylize('[Circular]', 'special');
					}
				}
				if (isUndefined(name)) {
					if (array && key.match(/^\d+$/)) {
						return str;
					}
					name = JSON.stringify('' + key);
					if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
						name = name.substr(1, name.length - 2);
						name = ctx.stylize(name, 'name');
					} else {
						name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
						name = ctx.stylize(name, 'string');
					}
				}

				return name + ': ' + str;
			}

			function reduceToSingleString(output, base, braces) {
				var numLinesEst = 0;
				var length = output.reduce(function (prev, cur) {
					numLinesEst++;
					if (cur.indexOf('\n') >= 0) numLinesEst++;
					return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
				}, 0);

				if (length > 60) {
					return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
				}

				return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
			}

			// NOTE: These type checking functions intentionally don't use `instanceof`
			// because it is fragile and can be easily faked with `Object.create()`.
			function isArray(ar) {
				return Array.isArray(ar);
			}
			exports.isArray = isArray;

			function isBoolean(arg) {
				return typeof arg === 'boolean';
			}
			exports.isBoolean = isBoolean;

			function isNull(arg) {
				return arg === null;
			}
			exports.isNull = isNull;

			function isNullOrUndefined(arg) {
				return arg == null;
			}
			exports.isNullOrUndefined = isNullOrUndefined;

			function isNumber(arg) {
				return typeof arg === 'number';
			}
			exports.isNumber = isNumber;

			function isString(arg) {
				return typeof arg === 'string';
			}
			exports.isString = isString;

			function isSymbol(arg) {
				return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'symbol';
			}
			exports.isSymbol = isSymbol;

			function isUndefined(arg) {
				return arg === void 0;
			}
			exports.isUndefined = isUndefined;

			function isRegExp(re) {
				return isObject(re) && objectToString(re) === '[object RegExp]';
			}
			exports.isRegExp = isRegExp;

			function isObject(arg) {
				return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && arg !== null;
			}
			exports.isObject = isObject;

			function isDate(d) {
				return isObject(d) && objectToString(d) === '[object Date]';
			}
			exports.isDate = isDate;

			function isError(e) {
				return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
			}
			exports.isError = isError;

			function isFunction(arg) {
				return typeof arg === 'function';
			}
			exports.isFunction = isFunction;

			function isPrimitive(arg) {
				return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'symbol' || // ES6 symbol
				typeof arg === 'undefined';
			}
			exports.isPrimitive = isPrimitive;

			exports.isBuffer = require('./support/isBuffer');

			function objectToString(o) {
				return Object.prototype.toString.call(o);
			}

			function pad(n) {
				return n < 10 ? '0' + n.toString(10) : n.toString(10);
			}

			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

			// 26 Feb 16:19:34
			function timestamp() {
				var d = new Date();
				var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
				return [d.getDate(), months[d.getMonth()], time].join(' ');
			}

			// log is just a thin wrapper to console.log that prepends a timestamp
			exports.log = function () {
				console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
			};

			/**
    * Inherit the prototype methods from one constructor into another.
    *
    * The Function.prototype.inherits from lang.js rewritten as a standalone
    * function (not on Function.prototype). NOTE: If this file is to be loaded
    * during bootstrapping this function needs to be rewritten using some native
    * functions as prototype setup using normal JavaScript does not work as
    * expected during bootstrapping (see mirror.js in r114903).
    *
    * @param {function} ctor Constructor function which needs to inherit the
    *     prototype.
    * @param {function} superCtor Constructor function to inherit prototype from.
    */
			exports.inherits = require('inherits');

			exports._extend = function (origin, add) {
				// Don't do anything if add isn't an object
				if (!add || !isObject(add)) return origin;

				var keys = Object.keys(add);
				var i = keys.length;
				while (i--) {
					origin[keys[i]] = add[keys[i]];
				}
				return origin;
			};

			function hasOwnProperty(obj, prop) {
				return Object.prototype.hasOwnProperty.call(obj, prop);
			}
		}).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
	}, { "./support/isBuffer": 4, "_process": 2, "inherits": 3 }], 6: [function (require, module, exports) {
		'use strict';

		var global = require('./ttk91js.global.js');

		var OPS = Object.keys(global.OP);

		var OUTPUT = {
			CRT: 0
		};

		var SVC = {
			HALT: 11
		};

		var MODE = global.MODE;

		var SP = 6;
		var FP = 7;

		function Ttk91jsCompileException(message, line) {
			this.name = 'Ttk91jsCompileException';
			this.message = message;
			this.line = line;
		}

		Ttk91jsCompileException.prototype.toString = function () {
			return this.name + ': ' + this.message;
		};

		function makeWord(op, rj, m, ri, addr) {
			var word = addr;
			word |= op << 24;
			word |= rj << 21;
			word |= m << 19;
			word |= ri << 16;

			return word;
		}

		function getOpArgCount(op) {
			op = global.OP[op];

			if (op === global.OP.NOP) return 0;else if (op == global.OP.NOT) {
				return 1;
			} else if (op >= global.OP.JUMP && op <= global.OP.JNGRE) {
				return 1;
			}

			return 2;
		}

		function isRegister(reg) {
			if (reg.length != 2) return false;else if (reg == 'SP' || reg == 'FP') return true;else return reg[0] == 'R' && /[0-9]/.test(reg[1]);
		}

		function isSymbol(s) {
			if (s[0] == '=' || s[0] == '@') {
				s = s.substring(1);
			}

			return (/^[a-z]+$/i.test(s)
			);
		}

		function isInteger(s) {
			if (s[0] == '=' || s[0] == '@') {
				s = s.substring(1);
			}

			return (/^[0-9]+$/.test(s)
			);
		}

		function isValidArgument(s) {
			return isSymbol(s) || isRegister(s) || isInteger(s);
		}

		function prepare(code) {
			var lines = code.split('\n');
			var instructions = [];
			var sourceMap = {};

			var symbols = [];
			var data = [];

			function getSymbol(s) {
				if (s[0] == '=' || s[0] == '@') {
					s = s.substring(1);
				}

				return s;
			}

			function symbolExists(s) {
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = symbols[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var sym = _step.value;

						if (sym.name == s) return true;
					}
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}

				switch (s) {
					case 'CRT':
					case 'HALT':
						return true;
				}

				return false;
			}

			var memoryPos = 0;

			var _loop = function _loop(l) {
				line = lines[l].trim();


				var i = line.indexOf(';');
				if (i != -1) {
					line = line.substring(0, i);
				}

				if (line.length === 0) {
					return "continue";
				}

				line = line.replace(/\s+/g, ' ');

				i = line.indexOf(' ');
				var parts = null;

				if (i == -1) {
					parts = [line.trim()];
				} else {
					parts = [line.substring(0, i), line.substring(i + 1)];
				}

				if (OPS.indexOf(parts[0]) == -1) {
					symbols.push({
						name: parts[0],
						addr: instructions.length,
						type: 'absolute',
						size: 1
					});

					i = parts[1].indexOf(' ');
					if (i != -1) parts = [parts[1].substring(0, i), parts[1].substring(i + 1)];
				}

				if (parts[0] == 'DC') {
					var value = parseInt(parts[1]);
					var name = symbols.pop().name;

					symbols.push({
						name: name,
						addr: memoryPos,
						type: 'relative',
						size: 1
					});

					data.push({
						value: value,
						size: 1
					});

					memoryPos += 1;
				} else if (parts[0] == 'DS') {
					var size = parseInt(parts[1]);
					var _name = symbols.pop().name;

					symbols.push({
						name: _name,
						addr: memoryPos,
						type: 'relative',
						size: size
					});

					data.push({
						value: 0,
						size: size
					});

					memoryPos += size;
				} else {
					var op = parts.shift();

					var args = [];
					if (parts.length > 0) {
						args = parts.join('').split(',').map(function (s) {
							return s.trim();
						});
					}

					if (OPS.indexOf(op) == -1) {
						throw new Ttk91jsCompileException('unknown opcode (' + op + ')', l);
					}

					args.forEach(function (arg) {
						if (!isValidArgument(arg)) {
							throw new Ttk91jsCompileException('syntax error (' + line + ')', l);
						}
					});

					if (getOpArgCount(op) != args.length) {
						throw new Ttk91jsCompileException('wrong argcount (' + op + ')');
					}

					if (args.length == 2) {
						i = args[1].indexOf('(');
						if (i != -1) {
							j = args[1].indexOf(')', i);

							if (j == -1) {
								throw new Ttk91jsCompileException('syntax error', l);
							} else {
								args.push(args[1].substring(i + 1, j));
								args[2] = parts[1].substring(0, i);
							}
						} else {
							if (args[1][0] == '=') {
								args.push('R0');
							} else if (args[1][0] == '@') {
								if (args[1][1] == 'R') {
									args.push('R' + args[1][2]);
									args[1] = '0';
								} else {
									args.push('R0');
								}
							} else {
								if (args[1][0] == 'R') {
									args.push(args[1]);
									args[2] = '=0';
								} else {
									args.push('R0');
								}
							}
						}
					}

					args.forEach(function (arg) {
						if (arg.length == 2 && arg[0] == 'R') {
							if (/0-9/.test(arg[1]) || parseInt(arg[1]) > 7) {
								throw new Ttk91jsCompileException('invalid register (' + arg + ')', l);
							}
						}
					});

					sourceMap[instructions.length] = l;

					instructions.push({
						line: l,
						code: [op].concat(args)
					});
				}
			};

			for (var l = 0; l < lines.length; l++) {
				var line;
				var j;

				var _ret = _loop(l);

				if (_ret === "continue") continue;
			}

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = instructions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var ins = _step2.value;

					if (ins.code.length == 2 && isSymbol(ins.code[1])) {
						var symbol = getSymbol(ins.code[1]);

						if (!symbolExists(symbol)) {
							throw new Ttk91jsCompileException('unknown symbol (' + symbol + ')', ins.line);
						}
					} else if (ins.code.length == 4 && isSymbol(ins.code[2])) {
						var _symbol = getSymbol(ins.code[2]);

						if (!symbolExists(_symbol)) {
							throw new Ttk91jsCompileException('unknown symbol (' + _symbol + ')', ins.line);
						}
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			return {
				code: instructions,
				symbols: symbols,
				data: data,
				sourceMap: sourceMap
			};
		}

		var compile = function compile(code) {
			var data = prepare(code);

			function getSymbolAddr(symbol) {
				for (var _i = 0; _i < data.symbols.length; _i++) {
					if (data.symbols[_i].name == symbol) {
						return data.symbols[_i].addr;
					}
				}
			}

			function getRegister(reg) {
				if (reg == 'SP') return SP;else return parseInt(reg[1]);
			}

			var words = [];

			for (var _i2 = 0; _i2 < data.symbols.length; _i2++) {
				if (data.symbols[_i2].type == 'relative') {
					data.symbols[_i2].addr += data.code.length;
				}

				delete data.symbols[_i2].type;
			}

			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = data.code[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var ins = _step3.value;

					var d = ins.code;
					var op = global.OP[d[0]];

					var rj = 0;
					var ri = 0;

					var m = MODE.DIRECT;
					var addr = 0;

					if (d.length > 1) {
						if (isRegister(d[1])) {
							rj = getRegister(d[1]);
						} else {
							rj = getSymbolAddr(d[1]);
						}
					}

					if (d.length > 2) {
						if (d[2][0] == '=') {
							m = MODE.IMMEDIATE;

							var s = d[2].substring(1);

							if (/^[0-9]+$/i.test(s)) {
								addr = parseInt(s);
							} else {
								switch (s) {
									case 'CRT':
										addr = OUTPUT.CRT;
										break;
									case 'HALT':
										addr = SVC.HALT;
										break;
								}
							}
						} else if (d[2][0] == '@') {
							m = MODE.INDIRECT;
							addr = parseInt(d[2].substring(1));
						} else {
							if (/^[a-z]+$/i.test(d[2])) {
								addr = getSymbolAddr(d[2]);
							} else {
								addr = parseInt(d[2]);
							}
						}

						ri = getRegister(d[3]);
					}

					if (op >= global.OP.JUMP && op <= global.OP.JNGRE) {
						addr = rj;
						rj = 0;
						m = 0;
					}

					var word = makeWord(op, rj, m, ri, addr);

					words.push(word);
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}

			return { code: words, symbols: data.symbols, data: data.data, sourceMap: data.sourceMap };
		};

		module.exports = compile;
	}, { "./ttk91js.global.js": 7 }], 7: [function (require, module, exports) {

		function splitWord(word) {
			return [(word & 0xff << 24) >> 24, //op
			(word & 0x7 << 21) >> 21, //rj
			(word & 0x3 << 19) >> 19, //m
			(word & 0x7 << 16) >> 16, //ri
			word & 0xffff];
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
			}
		};
	}, {}], 8: [function (require, module, exports) {
		'use strict';

		var util = require('util');

		var global = require('./ttk91js.global.js');
		var compile = require('./ttk91js.compile.js');
		var Machine = require('./ttk91js.machine.js');

		var OPS = Object.keys(global.OP);
		var OPSV = {};

		for (var op in global.OP) {
			OPSV[global.OP[op]] = op;
		}

		function wordToString(word) {
			var _global$splitWord = global.splitWord(word),
			    _global$splitWord2 = _slicedToArray(_global$splitWord, 5),
			    op = _global$splitWord2[0],
			    rj = _global$splitWord2[1],
			    m = _global$splitWord2[2],
			    ri = _global$splitWord2[3],
			    addr = _global$splitWord2[4];

			if (op === 0) {
				return 'NOP';
			}

			var ms = '';
			switch (m) {
				case global.MODE.IMMEDIATE:
					ms = '=';
					break;
				case global.MODE.INDIRECT:
					ms = '@';
					break;
			}

			if (op >= global.OP.JUMP && op <= global.OP.JNGRE) {
				return util.format('%s %d', OPSV[op], addr);
			} else {
				var rjs = 'R' + rj;
				if (rj == 6) rjs = 'SP';else if (rj == 7) rjs = 'FP';

				return util.format('%s %s, %s%s(R%s)', OPSV[op], rjs, ms, addr, ri);
			}
		}

		var debug = {
			word: function word(_word) {
				var s = ('0'.repeat(32) + (_word >>> 0).toString(2)).slice(-32);
				;
			},
			bin: function bin(dec) {
				;
			}
		};

		var ttk91js = {
			wordToString: wordToString,
			compile: compile,
			createMachine: function createMachine(settings) {
				return new Machine(settings);
			},
			debug: debug
		};

		if (typeof window == 'undefined') {
			module.exports = ttk91js;
		} else {
			window.ttk91js = ttk91js;
		}
	}, { "./ttk91js.compile.js": 6, "./ttk91js.global.js": 7, "./ttk91js.machine.js": 9, "util": 5 }], 9: [function (require, module, exports) {
		(function (process) {
			'use strict';

			var MicroEvent = require('microevent');
			var global = require('./ttk91js.global.js');

			var OUTPUT = {
				CRT: 0
			};

			var SVC = {
				HALT: 11
			};

			var BIT_L = 4;
			var BIT_E = 2;
			var BIT_G = 1;

			var SP = 6;
			var FP = 7;
			var PC = 8;

			var OP = global.OP;

			function Ttk91jsRuntimeException(message, line) {
				this.name = 'Ttk91jsRuntimeException';
				this.message = message;
				this.line = line;
			}

			Ttk91jsRuntimeException.prototype.toString = function () {
				return this.name + ': ' + this.message;
			};

			function Machine(settings) {
				this.settings = settings;

				this.memory = new Uint32Array(settings.memory);
				this.reg = new Uint32Array(9);

				this.stdout = {
					write: function write(out) {
						process.stdout.write(out + '\n');
					}
				};

				this.oldPC = 0;
				this.data = null;

				this.reset();
			}

			Machine.prototype = {
				_getValue: function _getValue(m, ri, addr) {
					var value = 0;

					if (ri === 0) value = addr;else value = this.reg[ri] + addr;

					if (m > 0) {
						value = this._getValue(--m, ri, this.getMemoryAt(addr));
					}

					return value;
				},

				load: function load(data) {
					var i = 0;
					for (; i < data.code.length; i++) {
						this.memory[i] = data.code[i];
					}

					var pos = 0;
					for (var j = 0; j < data.data.length; j++) {
						this.memory[i + pos] = data.data[j].value;
						pos += data.data[j].size;
					}

					this.data = data;
				},

				getMemoryAt: function getMemoryAt(addr) {
					if (addr < 0 || addr >= this.memory.length) {
						throw new Ttk91jsRuntimeException('trying to access outside of program memory (' + addr + ')', this.oldPC);
					}

					return this.memory[addr];
				},

				setMemoryAt: function setMemoryAt(addr, value) {
					if (addr < 0 || addr >= this.memory.length) {
						throw new Ttk91jsRuntimeException('trying to access outside of program memory (' + addr + ')', this.oldPC);
					}

					this.memory[addr] = value;
				},

				getRegisters: function getRegisters() {
					return this.reg;
				},

				getMemory: function getMemory() {
					return this.memory;
				},

				stop: function stop() {
					this.ok = false;
				},

				setStdout: function setStdout(out) {
					this.stdout = out;
				},

				reset: function reset() {
					this.ok = true;
					this.SR = 0;
					this.reg.fill(0);
					this.memory.fill(0);
					this.data = null;
					this.oldPC = 0;
				},

				run: function run(max) {
					max = max || -1;

					var loop = 0;

					while (this.isRunning()) {
						this.runWord();
						loop++;

						if (max > 0 && loop >= max) {
							break;
						}
					}
				},

				isRunning: function isRunning() {
					return this.ok && this.reg[PC] < this.memory.length;
				},

				runWord: function runWord(count) {
					count = count || 1;

					for (var i = 0; i < count; i++) {
						this._runWord();
					}
				},

				_runWord: function _runWord() {
					this.oldPC = this.reg[PC];

					var _global$splitWord3 = global.splitWord(this.getMemoryAt(this.reg[PC])),
					    _global$splitWord4 = _slicedToArray(_global$splitWord3, 5),
					    op = _global$splitWord4[0],
					    rj = _global$splitWord4[1],
					    m = _global$splitWord4[2],
					    ri = _global$splitWord4[3],
					    addr = _global$splitWord4[4];

					var value = this._getValue(m, ri, addr);

					this.reg[PC]++;

					switch (op) {
						case OP.NOP:
							break;
						case OP.STORE:
							if (this.settings.triggerMemoryWrite) {
								this.trigger('memory-write', addr, this.getMemoryAt(addr), this.reg[rj]);
							}

							this.setMemoryAt(addr, this.reg[rj]);

							break;
						case OP.LOAD:
							if (this.settings.triggerRegisterWrite) {
								this.trigger('register-write', rj, this.reg[rj], value);
							}

							this.reg[rj] = value;

							break;
						case OP.OUT:
							switch (addr) {
								case OUTPUT.CRT:
									this.stdout.write(this.reg[rj]);

									break;
							}

							break;

						case OP.ADD:
							this.reg[rj] += value;
							break;
						case OP.SUB:
							this.reg[rj] -= value;
							break;
						case OP.DIV:
							this.reg[rj] = Math.floor(this.reg[rj] / value);
							break;
						case OP.MUL:
							this.reg[rj] *= value;
							break;
						case OP.MOD:
							this.reg[rj] = this.reg[rj] % value;
							break;
						case OP.AND:
							this.reg[rj] = this.reg[rj] & value;
							break;
						case OP.OR:
							this.reg[rj] = this.reg[rj] | value;
							break;
						case OP.XOR:
							this.reg[rj] = this.reg[rj] ^ value;
							break;
						case OP.SHL:
							this.reg[rj] = this.reg[rj] << value;
							break;
						case OP.SHR:
							this.reg[rj] = this.reg[rj] >> value;
							break;
						case OP.SHRA:
							this.reg[rj] = this.reg[rj] >>> value;
							break;
						case OP.NOT:
							this.reg[rj] = ~this.reg[rj];
							break;
						case OP.SVC:
							switch (addr) {
								case SVC.HALT:
									this.ok = false;
									this.trigger('halt');

									break;
							}
							break;
						case OP.COMP:
							this.SR = 0;

							if (this.reg[rj] == value) this.SR |= BIT_E;
							if (this.reg[rj] > value) this.SR |= BIT_G;
							if (this.reg[rj] < value) this.SR |= BIT_L;

							break;
						case OP.JUMP:
							this.reg[PC] = addr;

							break;
						case OP.JNEG:
							break;
						case OP.JZER:
							break;
						case OP.JPOS:
							break;
						case OP.JNNEG:
							break;
						case OP.JNZER:
							break;
						case OP.JNPOS:
							break;
						case OP.JLES:
							break;
						case OP.JEQU:
							if (this.SR & BIT_E) this.reg[PC] = this.getMemoryAt(addr);

							break;
						case OP.JGRE:
							break;
						case OP.JNLES:
							break;
						case OP.JNEQU:
							if (!(this.SR & BIT_E)) this.reg[PC] = this.getMemoryAt(addr);

							break;
						case OP.JNGRE:
							break;
						default:
							throw new Ttk91jsRuntimeException('unknown opcode (' + op + ')', this.oldPC);
					}

					if (this.settings.triggerRegisterWrite) {
						this.trigger('register-write', PC, this.oldPC, this.reg[PC]);
					}
				}
			};

			MicroEvent.mixin(Machine);

			module.exports = Machine;
		}).call(this, require('_process'));
	}, { "./ttk91js.global.js": 7, "_process": 2, "microevent": 1 }] }, {}, [8]);