import Route from './Route';
import watchLinks from './utils/watchLinks';
import isSameRoute from './utils/isSameRoute';

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
var location = window.history.location || window.location;

function noop () {}

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
		this._target = {
			href: location.href,
			popstate: true, // so we know not to manipulate the history
			fulfil: noop,
			reject: noop
		};

		this._goto( this._target );
	}, false );
}

Roadtrip.prototype = {
	add ( path, options ) {
		this.routes.push( new Route( path, options ) );
		return this;
	},

	start () {
		return this.goto( location.href, { replaceState: true });
	},

	goto ( href, options = {} ) {
		let target;
		let promise = new roadtrip.Promise( ( fulfil, reject ) => {
			target = this._target = { href, options, fulfil, reject };
		});

		if ( this.isTransitioning ) {
			return promise;
		}

		this._goto( target );
		return promise;
	},

	_goto ( target ) {
		let i, len = this.routes.length;
		let newRoute, data;

		for ( i = 0; i < len; i += 1 ) {
			let route = this.routes[i];
			data = route.exec( target.href );

			if ( data ) {
				newRoute = route;
				break;
			}
		}

		// TODO handle changes to query string/hashbang differently
		if ( !newRoute || isSameRoute( newRoute, this.currentRoute, data, this.currentData ) ) {
			return target.fulfil();
		}

		this.isTransitioning = true;

		roadtrip.Promise.all([
			this.currentRoute.leave( this.currentData, data ),
			newRoute.beforeenter( data, this.currentData )
		])
			.then( () => newRoute.enter( data, this.currentData ) )
			.then( () => {
				this.isTransitioning = false;

				// if the user navigated while the transition was taking
				// place, we need to do it all again
				if ( this._target !== target ) {
					this._goto( this._target );
				}

				else {
					target.fulfil();
				}
			})
			.catch( target.reject );

		this.currentRoute = newRoute;
		this.currentData = data;

		if ( target.popstate ) return;
		history[ target.options.replaceState ? 'replaceState' : 'pushState' ]( {}, '', target.href );
	}
};

let roadtrip = new Roadtrip();
roadtrip.Promise = window.Promise;

export default roadtrip;
