var gobble = require( 'gobble' );

module.exports = gobble([
	gobble( 'src' ).transform( 'rollup-babel', {
		entry: 'roadtrip.js',
		dest: 'roadtrip.umd.js',
		format: 'umd',
		moduleName: 'roadtrip'
	}),

	gobble( 'src' ).transform( 'rollup-babel', {
		entry: 'roadtrip.js',
		dest: 'roadtrip.es6.js',
		format: 'es6'
	})
]);
