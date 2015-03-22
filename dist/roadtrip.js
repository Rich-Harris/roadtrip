(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.roadtrip = factory()
}(this, function () { 'use strict';

	var a = document.createElement("a");
	var QUERYPAIR_REGEX = /^([\w\-]+)(?:=([\w\-]*))?$/;
	var HANDLERS = ["beforeenter", "enter", "leave"];

	var isInitial = true;

	function RouteData(_ref) {
		var route = _ref.route;
		var pathname = _ref.pathname;
		var params = _ref.params;
		var query = _ref.query;
		var isInitial = _ref.isInitial;

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

				if (options.enter) {
					value = options.enter(route, from);
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
					    value = match[2];

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

			return new RouteData({ route: this, pathname: pathname, params: params, query: query, isInitial: isInitial });
		}
	};

	function segmentsMatch(a, b) {
		if (a.length !== b.length) return;

		var i = a.length;
		while (i--) {
			return b[0] === ":" || a === b;
		}
	}

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

	var roadtrip__location = window.history.location || window.location;

	function Roadtrip() {
		var _this = this;

		this.routes = [];

		this.currentData = {};
		this.currentRoute = {
			enter: function () {
				return roadtrip.Promise.resolve();
			},
			leave: function () {
				return roadtrip.Promise.resolve();
			}
		};

		this.base = "";

		watchLinks(function (href) {
			return _this.goto(href);
		});

		window.addEventListener("popstate", function () {
			_this.goto(roadtrip__location.href);
		}, false);
	}

	Roadtrip.prototype = {
		add: function (path, options) {
			this.routes.push(new Route(path, options));
			return this;
		},

		start: function () {
			this.goto(roadtrip__location.href, { replaceState: true });
		},

		goto: function (href) {
			var _this = this;

			var options = arguments[1] === undefined ? {} : arguments[1];

			var i = undefined,
			    len = this.routes.length;
			var newRoute = undefined,
			    data = undefined;

			var target = this._target = { href: href, options: options };

			if (this.isTransitioning) {
				return;
			}

			for (i = 0; i < len; i += 1) {
				var route = this.routes[i];
				data = route.exec(href);

				if (data) {
					newRoute = route;
					break;
				}
			}

			// TODO handle changes to query string/hashbang
			if (!newRoute || newRoute === this.currentRoute) return;

			this.isTransitioning = true;

			this.currentRoute.leave(this.currentData);

			roadtrip.Promise.all([this.currentRoute.leave(this.currentData, data), newRoute.beforeEnter(data, this.currentData)]).then(function () {
				return newRoute.enter(data, _this.currentData);
			}).then(function () {
				_this.isTransitioning = false;

				// if the user navigated while the transition was taking
				// place, we need to do it all again
				if (_this._target !== target) {
					_this.goto(_this._target.href, _this._target.options);
				}
			});

			this.currentRoute = newRoute;
			this.currentData = data;

			history[options.replaceState ? "replaceState" : "pushState"]({}, "", href);
		}
	};

	var roadtrip = new Roadtrip();
	roadtrip.Promise = window.Promise;

	return roadtrip;

}));