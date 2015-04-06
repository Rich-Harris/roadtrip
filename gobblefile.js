var gobble = require( 'gobble' );

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

module.exports = gobble( 'src' )
	.transform( 'babel', {
		whitelist: babelWhitelist
	})
	.transform( 'esperanto-bundle', {
		entry: 'roadtrip',
		type: 'umd',
		name: 'roadtrip'
	})
	.transform( 'sorcery' );