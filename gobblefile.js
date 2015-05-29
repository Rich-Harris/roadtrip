var gobble = require( 'gobble' );

module.exports = gobble( 'src' )
	.transform( 'babel' )
	.transform( 'rollup', {
		entry: 'roadtrip.js',
		dest: 'roadtrip.js',
		format: 'umd',
		moduleName: 'roadtrip'
	});
