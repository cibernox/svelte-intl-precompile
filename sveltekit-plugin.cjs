const babel = require('@babel/core');
const buildPlugin = require("babel-plugin-precompile-intl");
const path = require('path');
const fs = require('fs');

const intlPrecompiler = buildPlugin('svelte-intl-precompile');

function detectLanguageCode (filepath) {
	return path.basename(filepath).split('.')[0]
}

function transformCode(code) {
	return babel.transform(code, { plugins: [intlPrecompiler] }).code;
}

function svelteIntlPrecompile(localesRoot, prefix = '$locales') {
	const resolvedPath = path.resolve(localesRoot)

	return {
		name: 'svelte-intl-precompile', // required, will show up in warnings and errors
		configureServer(server) {
			const { ws, watcher, moduleGraph } = server

			watcher.on('change', async(file) => {
				if(file.includes(resolvedPath)){
					const name = `${prefix}/${detectLanguageCode(file)}`
					const module = moduleGraph.getModuleById(`${name}.ts`) || moduleGraph.getModuleById(`${name}.js`);
					if (module) {
						moduleGraph.invalidateModule(module);
					}
					ws.send({ type: 'full-reload', path: '*' })
				}
			})
		},
		resolveId(id) {
			if (id.startsWith(prefix)) {
				return id;
			}
		},
		load(id) {
			if (id.startsWith(prefix)) {
				const code = fs.readFileSync(path.join(localesRoot, `${detectLanguageCode(id)}.json`), {
					encoding: 'utf-8'
				});
				return transformCode(`export default ${code}`);
			}
		},
		transform(code, id) {
			if (id.includes(resolvedPath)) {
				return transformCode(code);
			}
		}
	}
}

svelteIntlPrecompile.transformCode = transformCode;

module.exports = svelteIntlPrecompile;
