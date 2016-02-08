import roadtrip from './roadtrip.js';

const a = document.createElement( 'a' );
const QUERYPAIR_REGEX = /^([\w\-]+)(?:=([^&]*))?$/;
const HANDLERS = [ 'beforeenter', 'enter', 'leave' ];

let isInitial = true;

function RouteData ({ route, pathname, params, query }) {
	this.pathname = pathname;
	this.params = params;
	this.query = query;
	this.isInitial = isInitial;

	this._route = route;

	isInitial = false;
}

RouteData.prototype = {
	matches ( href ) {
		return this._route.matches( href );
	}
};

export default function Route ( path, options ) {
	// strip leading slash
	if ( path[0] === '/' ) {
		path = path.slice( 1 );
	}

	this.path = path;
	this.segments = path.split( '/' );

	if ( typeof options === 'function' ) {
		options = {
			enter: options
		};
	}

	HANDLERS.forEach( handler => {
		this[ handler ] = ( route, other ) => {
			let value;

			if ( options[ handler ] ) {
				value = options[ handler ]( route, other );
			}

			return roadtrip.Promise.resolve( value );
		};
	});
}

Route.prototype = {
	matches ( href ) {
		a.href = href;

		let pathname = a.pathname.slice( 1 );
		let segments = pathname.split( '/' );

		return segmentsMatch( segments, this.segments );
	},

	exec ( href ) {
		a.href = href;

		let pathname = a.pathname.slice( 1 );
		let search = a.search.slice( 1 );

		let segments = pathname.split( '/' );

		if ( segments.length !== this.segments.length ) {
			return false;
		}

		let params = {}, i;

		for ( i = 0; i < segments.length; i += 1 ) {
			let segment = segments[i];
			let toMatch = this.segments[i];

			if ( toMatch[0] === ':' ) {
				params[ toMatch.slice( 1 ) ] = segment;
			}

			else if ( segment !== toMatch ) {
				return false;
			}
		}

		let query = {};
		let queryPairs = search.split( '&' );

		for ( i = 0; i < queryPairs.length; i += 1 ) {
			let match = QUERYPAIR_REGEX.exec( queryPairs[i] );

			if ( match ) {
				let key = match[1], value = decodeURIComponent( match[2] );

				if ( query.hasOwnProperty( key ) ) {
					if ( typeof query[ key ] !== 'object' ) {
						query[ key ] = [ query[ key ] ];
					}

					query[ key ].push( value );
				}

				else {
					query[ key ] = value;
				}
			}
		}

		return new RouteData({ route: this, pathname, params, query });
	}
};

function segmentsMatch ( a, b ) {
	if ( a.length !== b.length ) return;

	let i = a.length;
	while ( i-- ) {
		if ( ( a[i] !== b[i] ) && ( b[i][0] !== ':' ) ) {
			return false;
		}
	}

	return true;
}
