export default function isSameRoute ( routeA, routeB, dataA, dataB ) {
	if ( routeA !== routeB ) {
		return false;
	}

	return deepEqual( dataA.params, dataB.params ) && deepEqual( dataA.query, dataB.query );
}

function deepEqual ( a, b ) {
	if ( a === null && b === null ) {
		return true;
	}

	if ( isArray( a ) && isArray( b ) ) {
		let i = a.length;

		if ( b.length !== i ) return false;

		while ( i-- ) {
			if ( !deepEqual( a[i], b[i] ) ) {
				return false;
			}
		}

		return true;
	}

	else if ( typeof a === 'object' && typeof b === 'object' ) {
		const aKeys = Object.keys( a );
		const bKeys = Object.keys( b );

		let i = aKeys.length;

		if ( bKeys.length !== i ) return false;

		while ( i-- ) {
			let key = aKeys[i];

			if ( !b.hasOwnProperty( key ) || !deepEqual( b[ key ], a[ key ] ) ) {
				return false;
			}
		}

		return true;
	}

	return a === b;
}

const toString = Object.prototype.toString;

function isArray ( thing ) {
	return toString.call( thing ) === '[object Array]';
}