const babel = require('@babel/core');
const buildPlugin = require("babel-plugin-precompile-intl");
const path = require('path');

const intlPrecompiler = buildPlugin('svelte-intl-precompile');

module.exports = function svelteIntlPrecompile(localesRoot) {  
	return {
	  	name: 'svelte-intl-precompile', // required, will show up in warnings and errors
		transform(code, id) {	
			if (id.includes(path.resolve(localesRoot))) {
				return babel.transform(code, {
					plugins: [intlPrecompiler],

				}).code;
			}
		}
	}
}
