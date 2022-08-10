## 0.12.0
- Now the `$date`, `$time` and `$number` stores automatically update when the current locale changes.
## 0.11.0
- Update precompile-intl-runtime, which contains improvements in the algorithm that chooses the best locale from the locale HTTP header of a request.
## 0.11.0-beta.2
- Add a funcionality to exclude certain files in the locales folder from being processed. That `exclude` property
  can be either a regular expression or a function that takes the file name and returns a boolean. This features
  replaces the reverted feature from beta.1
- Revert change that made that only languages matching `xx` or `xx-XX` are processed. Turns out that detecting
  what is a valid language name is more complex than that. 
## 0.11.0-beta.1
- Ensure that only the files in the locales folder that match a language name (`xx` or `xx-XX`) are processed.
## 0.10.1
- Ignore any file in the locales folder which name (excluding the extension) does not match ISO locale names. E.g. `en` or `en-US` (Although not technically correct, `en-us` is also accepted)
## 0.10.0
- Support template literals when translations are defined in javascript files.
## 0.10.0-beta.1
- Adds support for using `scale` in number skeletons. It is compiled at build time to a simple math operation like `number / 100`.
## 0.10.0-beta.0
- Support number skeletons (beta)
## 0.9.2
- Make 0.9.1 actually work.
## 0.9.1
- [BUGFIX] Ensure the formatters work when the app is compiled with the immutable flag on and the locale changes
## 0.8.0
- [FEATURE] Support all i18n-ally file formats for locales – json5 (`.json5` and `.json`) and yaml (`.yaml` and `.yml`)
- [FEATURE] Support locales to be defined within `.js`, `.ts`, and `.mjs` files
- [FEATURE] Allow configuring new transformers based on file extension
- [FEATURE] Support loading of locales without an extension (`$locales/en` instead of `$locales/en.js`)
- [FEATURE] Sort `availableLocales` export of `$locales` module that more specific locales come first `en-US` comes before `en`
- [FEATURE] Add `filename` to babel transform for better debugging
- [FEATURE] Add typescript definitions for `svelte-intl-precompile/sveltekit-plugin`
- [FEATURE] Add `exports` field to `package.json` with legacy `./sveltekit-plugin.js` and `./sveltekit-plugin.cjs` exports
- [BUGFIX] Invalidate `$locales` module in HMR mode if a file within the locales directory has changed
- [BUGFIX] Normalize paths when determining if a file is within the locales directory
- [BUGFIX] Add `index.cjs` to re-export `precompile-intl-runtime` for cjs compat loading
- [BUILD] Autogenerate `./sveltekit-plugin.cjs` from `./sveltekit-plugin.js` during publishing
## 0.7.0
- [FEATURE] expose the `prefix` (default: `$locales`) as a module that allows to register (`registerAll()`) and access (`availableLocales`) all available translations.
## 0.6.2
- [BUGFIX] Update babel pluging to fix a bug with translations that only contain a single date/time helper and no other text.
- ## 0.6.1
- [BUGFIX] Fix bug with exact plurals having two or more digits. E.g `=12 {a docen cats}`.
## 0.6.0
- Updates the babel plugin which in turn now depends on the new `@formatjs/icu-message-parser` package, which replaces the now 
  unmaintained `intl-message-parser`. It is supposed to be compatible although I've identified one corner case where some previously
  supported feature (nested plurals) are now not supported anymore. Opened https://github.com/formatjs/formatjs/issues/3250 to fix this.
## 0.5.0
- Updates the babel pluging that precompiles ICU strings. Should be backwards compatible, but it's risky enough to grant a minor version bump.
## 0.4.2
- Export internal `transformCode(str)` function to create interactive playground.
## 0.4.0
- [FEATURE] Supports defining translations in plain json files. This makes much easier to integrate this library with i18n flows like Lokalise. In reality this 
  has always been the goal and having to define translations in JS/TS files was just a workaround while figuring out how it works.
  Now if your translations are defined in `/locales/en.json` you can import it from `$locales/en.js` and svelte will know what to do.
## 0.3.4
- Reexport type definitions so typescript detects types properly.
## 0.3.2
- Bump `babel-plugin-precompile-intl` to fix bug when ICU string start with an expression but end with something else.
## 0.3.1
- Update `precompile-intl-runtime` to 0.4.2 which allows for the `getLocaleFromNavigator` function to receive an optional parameter that is the value to return when SSR'ing.

## 0.3.0

- Add two versions of the SvelteKit plugin: One in ES6 module syntax ending in `.js` and one in commonJS ending in `.cjs`.
