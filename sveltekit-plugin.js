const babel = require('@babel/core');
const intlPrecompiler = require("babel-plugin-precompile-intl");
const path = require('path');

export default function svelteIntlPrecompile(localesRoot) {  
	return {
	  	name: 'svelte-intl-precompile', // required, will show up in warnings and errors
		transform(code, id) {	
			if (id.includes(path.resolve(localesRoot))) {
				return babel.transform(code, {
					plugins: [intlPrecompiler]
				}).code;
			}
		}
	}
}
