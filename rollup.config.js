import buble from 'rollup-plugin-buble';

export default {
	entry: 'src/roadtrip.js',
	plugins: [ buble() ],
	moduleName: 'roadtrip'
};
