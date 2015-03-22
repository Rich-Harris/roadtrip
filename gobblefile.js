var gobble = require( 'gobble' );
var lib, demo;

var babelWhitelist = [
	'es6.arrowFunctions',
	'es6.blockScoping',
	'es6.constants',
	'es6.destructuring',
	'es6.parameters.default',
	'es6.parameters.rest',
	'es6.properties.shorthand',
	'es6.spread',
	'es6.templateLiterals'
];

lib = gobble( 'src' )
	.transform( 'babel', {
		whitelist: babelWhitelist
	})
	.transform( 'esperanto-bundle', {
		entry: 'roadtrip',
		type: 'umd',
		name: 'roadtrip'
	})
	.transform( 'sorcery' );

if ( gobble.env() === 'production' ) {
	module.exports = lib;
} else {
	demo = gobble( 'demo' ).transform( 'babel', {
		whitelist: babelWhitelist
	});

	module.exports = gobble([ lib, demo ]);
}
