import Route from './Route.js';
import watchLinks from './utils/watchLinks.js';
import isSameRoute from './utils/isSameRoute.js';
import routes from './routes.js';

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
const location = window.history.location || window.location;

function noop () {}

let currentData = {};
let currentRoute = {
	enter: () => roadtrip.Promise.resolve(),
	leave: () => roadtrip.Promise.resolve()
};

let _target;
let isTransitioning = false;

const roadtrip = {
	base: '',
	Promise: window.Promise,

	add ( path, options ) {
		routes.push( new Route( path, options ) );
		return roadtrip;
	},

	start () {
		return roadtrip.goto( location.href, { replaceState: true });
	},

	goto ( href, options = {} ) {
		let target;
		const promise = new roadtrip.Promise( ( fulfil, reject ) => {
			target = _target = { href, options, fulfil, reject };
		});

		if ( isTransitioning ) {
			return promise;
		}

		_goto( target );
		return promise;
	}
};

watchLinks( href => roadtrip.goto( href ) );

// watch history
window.addEventListener( 'popstate', () => {
	_target = {
		href: location.href,
		popstate: true, // so we know not to manipulate the history
		fulfil: noop,
		reject: noop
	};

	_goto( _target );
}, false );


function _goto ( target ) {
	let i, len = routes.length;
	let newRoute, data;

	for ( i = 0; i < len; i += 1 ) {
		let route = routes[i];
		data = route.exec( target.href );

		if ( data ) {
			newRoute = route;
			break;
		}
	}

	if ( !newRoute || isSameRoute( newRoute, currentRoute, data, currentData ) ) {
		return target.fulfil();
	}

	isTransitioning = true;

	roadtrip.Promise.all([
		currentRoute.leave( currentData, data ),
		newRoute.beforeenter( data, currentData )
	])
		.then( () => newRoute.enter( data, currentData ) )
		.then( () => {
			isTransitioning = false;

			// if the user navigated while the transition was taking
			// place, we need to do it all again
			if ( _target !== target ) {
				_goto( _target );
			} else {
				target.fulfil();
			}
		})
		.catch( target.reject );

	currentRoute = newRoute;
	currentData = data;

	if ( target.popstate ) return;
	history[ target.options.replaceState ? 'replaceState' : 'pushState' ]( {}, '', target.href );
}

export default roadtrip;
