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

const scrollHistory = {};
let uniqueID = 1;
let currentID = uniqueID;

const roadtrip = {
	base: '',
	Promise: window.Promise,

	add ( path, options ) {
		routes.push( new Route( path, options ) );
		return roadtrip;
	},

	start ( options = {} ) {
		const href = routes.some( route => route.matches( location.href ) ) ?
			location.href :
			options.fallback;

		return roadtrip.goto( href, {
			replaceState: true,
			scrollX: window.scrollX,
			scrollY: window.scrollY
		});
	},

	goto ( href, options = {} ) {
		scrollHistory[ currentID ] = {
			x: window.scrollX,
			y: window.scrollY
		};

		let target;
		const promise = new roadtrip.Promise( ( fulfil, reject ) => {
			target = _target = {
				href,
				scrollX: options.scrollX || 0,
				scrollY: options.scrollY || 0,
				options,
				fulfil,
				reject
			};
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
window.addEventListener( 'popstate', event => {
	if ( !event.state ) return; // hashchange, or otherwise outside roadtrip's control
	const scroll = scrollHistory[ event.state.uid ];

	_target = {
		href: location.href,
		scrollX: scroll.x,
		scrollY: scroll.y,
		popstate: true, // so we know not to manipulate the history
		fulfil: noop,
		reject: noop
	};

	_goto( _target );
	currentID = event.state.uid;
}, false );


function _goto ( target ) {
	let newRoute;
	let data;

	for ( let i = 0; i < routes.length; i += 1 ) {
		const route = routes[i];
		data = route.exec( target );

		if ( data ) {
			newRoute = route;
			break;
		}
	}

	if ( !newRoute || isSameRoute( newRoute, currentRoute, data, currentData ) ) {
		return target.fulfil();
	}

	scrollHistory[ currentID ] = {
		x: ( currentData.scrollX = window.scrollX ),
		y: ( currentData.scrollY = window.scrollY )
	};

	isTransitioning = true;

	roadtrip.Promise.all([
		currentRoute.leave( currentData, data ),
		newRoute.beforeenter( data, currentData )
	])
		.then( () => newRoute.enter( data, currentData ) )
		.then( () => {
			currentRoute = newRoute;
			currentData = data;
		})
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

	if ( target.popstate ) return;

	const uid = target.options.replaceState ? currentID : ++uniqueID;
	history[ target.options.replaceState ? 'replaceState' : 'pushState' ]( { uid }, '', target.href );

	currentID = uid;
	scrollHistory[ currentID ] = {
		x: target.scrollX,
		y: target.scrollY
	};
}

export default roadtrip;
