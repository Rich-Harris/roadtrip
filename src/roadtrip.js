import Route from './Route';
import watchLinks from './utils/watchLinks';

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
var location = window.history.location || window.location;

function Roadtrip () {
	this.routes = [];

	this.currentData = {};
	this.currentRoute = {
		enter: () => roadtrip.Promise.resolve(),
		leave: () => roadtrip.Promise.resolve()
	};

	this.base = '';

	watchLinks( href => this.goto( href ) );

	window.addEventListener( 'popstate', () => {
		this.goto( location.href );
	}, false );
}

Roadtrip.prototype = {
	add ( path, options ) {
		this.routes.push( new Route( path, options ) );
		return this;
	},

	start () {
		this.goto( location.href, { replaceState: true });
	},

	goto ( href, options = {} ) {
		let i, len = this.routes.length;
		let newRoute, data;

		let target = this._target = { href, options };

		if ( this.isTransitioning ) {
			return;
		}

		for ( i = 0; i < len; i += 1 ) {
			let route = this.routes[i];
			data = route.exec( href );

			if ( data ) {
				newRoute = route;
				break;
			}
		}

		// TODO handle changes to query string/hashbang
		if ( !newRoute || newRoute === this.currentRoute ) return;

		this.isTransitioning = true;

		this.currentRoute.leave( this.currentData)

		roadtrip.Promise.all([
			this.currentRoute.leave( this.currentData, data ),
			newRoute.beforeEnter( data, this.currentData )
		])
			.then( () => newRoute.enter( data, this.currentData ) )
			.then( () => {
				this.isTransitioning = false;

				// if the user navigated while the transition was taking
				// place, we need to do it all again
				if ( this._target !== target ) {
					this.goto( this._target.href, this._target.options );
				}
			});

		this.currentRoute = newRoute;
		this.currentData = data;

		history[ options.replaceState ? 'replaceState' : 'pushState' ]( {}, '', href );
	}
};

let roadtrip = new Roadtrip();
roadtrip.Promise = window.Promise;

export default roadtrip;
