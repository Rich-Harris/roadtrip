import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/roadtrip.js',
	plugins: [ babel() ],
	moduleName: 'roadtrip'
};
