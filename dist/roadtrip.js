(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.roadtrip = factory()
}(this, function () { 'use strict';

	var a = document.createElement("a");
	var QUERYPAIR_REGEX = /^([\w\-]+)(?:=([^&]*))?$/;
	var HANDLERS = ["beforeenter", "enter", "leave"];

	var isInitial = true;

	function RouteData(_ref) {
		var route = _ref.route;
		var pathname = _ref.pathname;
		var params = _ref.params;
		var query = _ref.query;

		this.pathname = pathname;
		this.params = params;
		this.query = query;
		this.isInitial = isInitial;

		this._route = route;

		isInitial = false;
	}

	RouteData.prototype = {
		matches: function (href) {
			return this._route.matches(href);
		}
	};
	function Route(path, options) {
		var _this = this;

		// strip leading slash
		if (path[0] === "/") {
			path = path.slice(1);
		}

		this.path = path;
		this.segments = path.split("/");

		if (typeof options === "function") {
			options = {
				enter: options
			};
		}

		HANDLERS.forEach(function (handler) {
			_this[handler] = function (route, other) {
				var value = undefined;

				if (options[handler]) {
					value = options[handler](route, other);
				}

				return roadtrip.Promise.resolve(value);
			};
		});
	}

	Route.prototype = {
		matches: function (href) {
			a.href = href;

			var pathname = a.pathname.slice(1);
			var segments = pathname.split("/");

			return segmentsMatch(segments, this.segments);
		},

		exec: function (href) {
			a.href = href;

			var pathname = a.pathname.slice(1);
			var search = a.search.slice(1);

			var segments = pathname.split("/");

			if (segments.length !== this.segments.length) {
				return false;
			}

			var params = {},
			    i = undefined;

			for (i = 0; i < segments.length; i += 1) {
				var segment = segments[i];
				var toMatch = this.segments[i];

				if (toMatch[0] === ":") {
					params[toMatch.slice(1)] = segment;
				} else if (segment !== toMatch) {
					return false;
				}
			}

			var query = {};
			var queryPairs = search.split("&");

			for (i = 0; i < queryPairs.length; i += 1) {
				var match = QUERYPAIR_REGEX.exec(queryPairs[i]);

				if (match) {
					var key = match[1],
					    value = decodeURIComponent(match[2]);

					if (query.hasOwnProperty(key)) {
						if (typeof query[key] !== "object") {
							query[key] = [query[key]];
						}

						query[key].push(value);
					} else {
						query[key] = value;
					}
				}
			}

			return new RouteData({ route: this, pathname: pathname, params: params, query: query });
		}
	};

	function segmentsMatch(a, b) {
		if (a.length !== b.length) return;

		var i = a.length;
		while (i--) {
			return b[0] === ":" || a === b;
		}
	}
	//# sourceMappingURL=/www/roadtrip/.gobble-build/01-babel/1/Route.js.01-babel.map

	// Adapted from https://github.com/visionmedia/page.js
	// MIT license https://github.com/visionmedia/page.js#license



	function watchLinks(callback) {
		window.addEventListener("click", handler, false);
		window.addEventListener("touchstart", handler, false);

		function handler(event) {
			if (which(event) !== 1) return;
			if (event.metaKey || event.ctrlKey || event.shiftKey) return;
			if (event.defaultPrevented) return;

			// ensure target is a link
			var el = event.target;
			while (el && el.nodeName !== "A") {
				el = el.parentNode;
			}

			if (!el || el.nodeName !== "A") return;

			// Ignore if tag has
			// 1. 'download' attribute
			// 2. rel='external' attribute
			if (el.hasAttribute("download") || el.getAttribute("rel") === "external") return;

			// ensure non-hash for the same path
			if (el.pathname === location.pathname && el.hash) return;

			var link = el.getAttribute("href");

			// Check for mailto: in the href
			if (~link.indexOf("mailto:")) return;

			// check target
			if (el.target) return;

			// x-origin
			if (!sameOrigin(el.href)) return;

			// rebuild path
			var path = el.pathname + el.search + (el.hash || "");

			// strip leading '/[drive letter]:' on NW.js on Windows
			if (typeof process !== "undefined" && path.match(/^\/[a-zA-Z]:\//)) {
				path = path.replace(/^\/[a-zA-Z]:\//, "/");
			}

			// same page
			var orig = path;

			if (path.indexOf(roadtrip.base) === 0) {
				path = path.substr(roadtrip.base.length);
			}

			if (roadtrip.base && orig === path) return;

			event.preventDefault();
			callback(orig);
		}
	}

	function which(event) {
		event = event || window.event;
		return event.which === null ? event.button : event.which;
	}

	function sameOrigin(href) {
		var origin = location.protocol + "//" + location.hostname;
		if (location.port) origin += ":" + location.port;

		return href && href.indexOf(origin) === 0;
	}
	//# sourceMappingURL=/www/roadtrip/.gobble-build/01-babel/1/utils/watchLinks.js.01-babel.map

	function isSameRoute(routeA, routeB, dataA, dataB) {
		if (routeA !== routeB) {
			return false;
		}

		return deepEqual(dataA.params, dataB.params) && deepEqual(dataA.query, dataB.query);
	}

	function deepEqual(a, b) {
		if (a === null && b === null) {
			return true;
		}

		if (isArray(a) && isArray(b)) {
			var i = a.length;

			if (b.length !== i) return false;

			while (i--) {
				if (!deepEqual(a[i], b[i])) {
					return false;
				}
			}

			return true;
		} else if (typeof a === "object" && typeof b === "object") {
			var aKeys = Object.keys(a);
			var bKeys = Object.keys(b);

			var i = aKeys.length;

			if (bKeys.length !== i) return false;

			while (i--) {
				var key = aKeys[i];

				if (!b.hasOwnProperty(key) || !deepEqual(b[key], a[key])) {
					return false;
				}
			}

			return true;
		}

		return a === b;
	}

	var toString = Object.prototype.toString;

	function isArray(thing) {
		return toString.call(thing) === "[object Array]";
	}
	//# sourceMappingURL=/www/roadtrip/.gobble-build/01-babel/1/utils/isSameRoute.js.01-babel.map

	var roadtrip__location = window.history.location || window.location;

	function noop() {}

	var routes = [];
	var currentData = {};
	var currentRoute = {
		enter: function () {
			return roadtrip.Promise.resolve();
		},
		leave: function () {
			return roadtrip.Promise.resolve();
		}
	};

	var _target = undefined;
	var isTransitioning = false;

	var roadtrip = {
		base: "",
		Promise: window.Promise,

		add: function (path, options) {
			routes.push(new Route(path, options));
			return roadtrip;
		},

		start: function () {
			return roadtrip.goto(roadtrip__location.href, { replaceState: true });
		},

		goto: function (href) {
			var options = arguments[1] === undefined ? {} : arguments[1];

			var target = undefined;
			var promise = new roadtrip.Promise(function (fulfil, reject) {
				target = _target = { href: href, options: options, fulfil: fulfil, reject: reject };
			});

			if (isTransitioning) {
				return promise;
			}

			_goto(target);
			return promise;
		}
	};

	watchLinks(function (href) {
		return roadtrip.goto(href);
	});

	// watch history
	window.addEventListener("popstate", function () {
		_target = {
			href: roadtrip__location.href,
			popstate: true, // so we know not to manipulate the history
			fulfil: noop,
			reject: noop
		};

		_goto(_target);
	}, false);

	function _goto(target) {
		var i = undefined,
		    len = routes.length;
		var newRoute = undefined,
		    data = undefined;

		for (i = 0; i < len; i += 1) {
			var route = routes[i];
			data = route.exec(target.href);

			if (data) {
				newRoute = route;
				break;
			}
		}

		if (!newRoute || isSameRoute(newRoute, currentRoute, data, currentData)) {
			return target.fulfil();
		}

		isTransitioning = true;

		roadtrip.Promise.all([currentRoute.leave(currentData, data), newRoute.beforeenter(data, currentData)]).then(function () {
			return newRoute.enter(data, currentData);
		}).then(function () {
			isTransitioning = false;

			// if the user navigated while the transition was taking
			// place, we need to do it all again
			if (_target !== target) {
				_goto(_target);
			} else {
				target.fulfil();
			}
		}).catch(target.reject);

		currentRoute = newRoute;
		currentData = data;

		if (target.popstate) return;
		history[target.options.replaceState ? "replaceState" : "pushState"]({}, "", target.href);
	}


	//# sourceMappingURL=/www/roadtrip/.gobble-build/01-babel/1/roadtrip.js.01-babel.map

	return roadtrip;

}));
//# sourceMappingURL=roadtrip.js.map