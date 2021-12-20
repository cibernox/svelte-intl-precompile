import babel from '@babel/core';
import buildPlugin from 'babel-plugin-precompile-intl';
import path from 'path';
import fs from 'fs';

const intlPrecompiler = buildPlugin('svelte-intl-precompile');

function detectLanguageCode (filepath) {
	return path.basename(filepath).split('.')[0]
}

export function transformCode(code) {
	return babel.transform(code, { plugins: [intlPrecompiler] }).code;
}

function svelteIntlPrecompile(localesRoot, prefix = '$locales') {
	const resolvedPath = path.resolve(localesRoot)

	return {
		name: 'svelte-intl-precompile', // required, will show up in warnings and errors
		enforce: 'pre',
		configureServer(server) {
			const { ws, watcher, moduleGraph } = server
			// listen to vite files watcher
			watcher.on('change', async(file) => {
				// check if file changed is a locale
				if(file.includes(resolvedPath)){
					const name = `${prefix}/${detectLanguageCode(file)}`
					// check if locale file is in vite cache
					const module = moduleGraph.getModuleById(`${name}.ts`) || moduleGraph.getModuleById(`${name}.js`);
					if (module) {
						moduleGraph.invalidateModule(module);
					}
					// trigger hmr
					ws.send({ type: 'full-reload', path: '*' })
				}
			})
		},
		resolveId(id) {
			if (id === prefix || id.startsWith(prefix + '/')) {
				return id;
			}
		},
		load(id) {
			// auto register locales by importing $locale module
			if (id === prefix) {
				const code = [
					`import { get } from 'svelte/store'`,
					`import { register, locales } from 'precompile-intl-runtime'`,
					// act as an alias for all helper functions
					// import { t } from '$locales'
					`export * from 'precompile-intl-runtime'`
				]

				// add register calls for each found locale
				for (const file of fs.readdirSync(localesRoot)) {
					if (path.extname(file) === '.json') {
						const locale = path.basename(file, '.json')

						code.push(
							`register(${JSON.stringify(locale)}, () => import(${
								JSON.stringify(`${prefix}/${locale}.js`)
							}))`,
						)
					}
				}

				// the default export can be used to get a list of all registered locales
				// import registeredLocales from '$locales'
				code.push(`export default /* @__PURE__ */ get(locales)`)

				return code.join('\n')
			}

			if (id.startsWith(prefix + '/')) {
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

export default svelteIntlPrecompile;
