'use strict';
const path = require('path');
const fs = require('fs/promises');

const babel = require('@babel/core');
const buildICUPlugin = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('babel-plugin-precompile-intl'));
const pathStartsWith = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('path-starts-with'))

const intlPrecompiler = buildICUPlugin('svelte-intl-precompile');

function transformCode(code, options) {
	return babel.transform(code, { ...options, plugins: [intlPrecompiler] }).code;
}
exports.transformCode = transformCode

const transformScript = (content) => content

const transformJSON = async (content) => {
	const { default: JSON5 } = await import('json5');
	return `export default ${JSON.stringify(JSON5.parse(content))}`;
}

const transformYaml = async (content, { filename }) => {
	const { load } = await import('js-yaml');
	return `export default ${JSON.stringify(load(content, { filename }))}`;
}

const stdTransformers = {
	// order matters as it defines which extensions are tried first
	// when looking for a matching file for a locale
	'.js': transformScript,
	'.ts': transformScript,
	'.mjs': transformScript,
	
	// use json5 loader for json files
	'.json': transformJSON,
	'.json5': transformJSON,

	'.yaml': transformYaml,
	'.yml': transformYaml,
};

function svelteIntlPrecompile(localesRoot, prefixOrOptions) {
	const {
		prefix = '$locales',
		transformers: customTransformers,
		exclude,
	} = typeof prefixOrOptions === 'string'
		? { prefix: prefixOrOptions }
		: { ...prefixOrOptions };

	const resolvedPath = path.resolve(localesRoot);

	const transformers = { ...stdTransformers, ...customTransformers }

	async function loadPrefixModule() {
		const code = [
			`import { register } from 'svelte-intl-precompile'`,
			`export function registerAll() {`
			// register('en', () => import('$locales/en'))
		];

		const availableLocales = [];
		const filesInLocalesFolder = await fs.readdir(localesRoot)
		const excludeFn = typeof exclude === 'function' ? exclude : (exclude instanceof RegExp ? (s) => exclude.test(s) : () => false);
		const languageFiles = filesInLocalesFolder.filter(name => !excludeFn(name));

		// add register calls for each found locale
		for (const file of languageFiles) {
			const extname = path.extname(file);

			if (transformers[extname]) {
				const locale = path.basename(file, extname);

				// ensure we register each locale only once
				// there shouldn't be more than one file each locale
				// our load(id) method only ever loads the first found
				// file for a locale and it makes no sense to register
				// more than one file per locale
				if (!availableLocales.includes(locale)) {
					availableLocales.push(locale);
	
					code.push(
						`  register(${JSON.stringify(locale)}, () => import(${
							JSON.stringify(`${prefix}/${locale}`)
						}))`,
					)
				}
			}
		}

		// Sort locales that more specific locales come first
		// 'en-US' comes before 'en'
		availableLocales.sort((a, b) => {
			const order = a.split('-').length - b.split('-').length

			if (order) return order

			return a.localeCompare(b, 'en')
		})

		code.push(
			`}`,
			`export const availableLocales = ${JSON.stringify(availableLocales)}`,
		);

		return code.join('\n');
	}

	async function tranformLocale(
		content,
		{
			filename,
			extname = path.extname(filename),
			basename = path.basename(filename, extname),
			transform = transformers[extname] || transformScript
		}
	) {
		const code = await transform(content, { filename, basename, extname });
		
		return transformCode(code, { filename });
	}

	async function findLocale(basename) {
		const filebase = path.resolve(localesRoot, basename);
		
		// lazy loaded here because strip-bom is an es module
		// and this file could be a cjs module
		// by using dynamic import we can load es modules
		const { default: stripBom } = await import('strip-bom');

		for await (const [extname, transform] of Object.entries(transformers)) {
			const filename = filebase + extname;

			try {
				const content = await fs.readFile(filename, { encoding: 'utf-8' });
	
				return tranformLocale(stripBom(content), { filename, basename, extname, transform });
			} catch (error) {
				// incase the file did not exist try next transformer
				// otherwise propagate the error
				if (error.code !== 'ENOENT') {
					throw error;
				}
			}
		}
	}

	return {
		name: 'svelte-intl-precompile', // required, will show up in warnings and errors
		enforce: 'pre',
		configureServer(server) {
			const { ws, watcher, moduleGraph } = server;
			// listen to vite files watcher
			watcher.on('change', (file) => {
				file = path.relative('', file);
				// check if file changed is a locale
				if (pathStartsWith(file, localesRoot)) {
					// invalidate $locales/<locales><extname> modules
					const name = `${prefix}/${path.basename(file, path.extname(file))}`;

					// Alltough we are normalizing the module names
					// $locales/en.js -> $locales/en
					// we check all configured extensions just to be sure
					// '.js', '.ts', '.json', ..., and '' ($locales/en)
					for (const extname of [...Object.keys(transformers), '']) {
						// check if locale file is in vite cache
						const localeModule = moduleGraph.getModuleById(`${name}${extname}`);

						if (localeModule) {
							moduleGraph.invalidateModule(localeModule);
						}
					}

					// invalidate $locales module
					const prefixModule = moduleGraph.getModuleById(prefix)
					if (prefixModule) {
						moduleGraph.invalidateModule(prefixModule);
					}

					// trigger hmr
					ws.send({ type: 'full-reload', path: '*' });
				}
			})
		},
		resolveId(id) {
			if (id === prefix || id.startsWith(`${prefix}/`)) {
				const extname = path.extname(id);

				// "normalize" module id to have no extension
				// $locales/en.js -> $locales/en
				// we do this as the extension is ignored
				// when loading a locale
				// we always try to find a locale file by its basename
				// and adding an extension from transformers
				// additionally this prevents loading the same module/locale
				// several times with different extensions
				const normalized = extname
					? id.slice(0, -extname.length)
					: id

				return normalized;
			}
		},
		load(id) {
			// allow to auto register locales by calling registerAll from $locales module
			// import { registerAll, availableLocales } from '$locales'
			if (id === prefix) {
				return loadPrefixModule();
			}

			// import en from '$locales/en'
			// import en from '$locales/en.js'
			if (id.startsWith(`${prefix}/`)) {
				const extname = path.extname(id);

				// $locales/en    -> en
				// $locales/en.js -> en
				// $locales/en.ts -> en
				const locale = extname
					? id.slice(`${prefix}/`.length, -extname.length)
					: id.slice(`${prefix}/`.length)

				return findLocale(locale);
			}
		},
		transform(content, id) {
			// import locale from '../locales/en.js'
			if (pathStartsWith(id, resolvedPath)) {
				return tranformLocale(content, { filename: id });
			}
		}
	}
}

svelteIntlPrecompile.transformCode = transformCode;

module.exports = svelteIntlPrecompile;
