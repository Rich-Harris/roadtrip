import roadtrip from './roadtrip.js';

const a = typeof document !== 'undefined' && document.createElement( 'a' );
const QUERYPAIR_REGEX = /^([^=]+)(?:=([^&]*))?$/;
const QUERYPAIR_SPACE = /\+/g;
const HANDLERS = [ 'beforeenter', 'enter', 'leave', 'update' ];

let isInitial = true;

function RouteData ({ route, pathname, params, query, hash, scrollX, scrollY }) {
	this.pathname = pathname;
	this.params = params;
	this.query = query;
	this.hash = hash;
	this.isInitial = isInitial;
	this.scrollX = scrollX;
	this.scrollY = scrollY;

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

	this.updateable = typeof options.update === 'function';

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

		const pathname = a.pathname.indexOf( '/' ) === 0 ?
			a.pathname.slice( 1 ) :
			a.pathname;
		const segments = pathname.split( '/' )
			.map( segment => decodeURIComponent( segment ) );

		return segmentsMatch( segments, this.segments );
	},

	exec ( target ) {
		a.href = target.href;

		const pathname = a.pathname.indexOf( '/' ) === 0 ?
			a.pathname.slice( 1 ) :
			a.pathname;
		const search = a.search.slice( 1 );

		const segments = pathname.split( '/' )
			.map( segment => decodeURIComponent( segment ) );

		if ( segments.length !== this.segments.length ) {
			return false;
		}

		const params = {};

		for ( let i = 0; i < segments.length; i += 1 ) {
			const segment = segments[i];
			const toMatch = this.segments[i];

			if ( toMatch[0] === ':' ) {
				params[ toMatch.slice( 1 ) ] = segment;
			}

			else if ( segment !== toMatch ) {
				return false;
			}
		}

		const query = {};
		const queryPairs = search.split( '&' );

		for ( let i = 0; i < queryPairs.length; i += 1 ) {
			const match = QUERYPAIR_REGEX.exec( queryPairs[i] );

			if ( match ) {
				const key = decodeURIComponent( match[1] )
					.replace( QUERYPAIR_SPACE, ' ' );
				const value = decodeURIComponent( match[2] )
					.replace( QUERYPAIR_SPACE, ' ' );

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

		return new RouteData({
			route: this,
			pathname,
			params,
			query,
			hash: a.hash.slice( 1 ),
			scrollX: target.scrollX,
			scrollY: target.scrollY
		});
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
