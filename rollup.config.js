import buble from 'rollup-plugin-buble';

const pkg = require( './package.json' );

export default {
	entry: 'src/roadtrip.js',
	plugins: [ buble() ],
	moduleName: 'roadtrip',
	targets: [
		{ dest: pkg.main, format: 'umd' },
		{ dest: pkg.module, format: 'es' }
	]
};
