## 0.6.1
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
  has always the goal and having to define translations in JS/TS files was just a workaround while figuring out how it works.
  Now if your translations are defined in `/locales/en.json` you can import it from `$locales/en.js` and svelte will know what to do.
## 0.3.4
- Reexport type definitions so typescript detects types properly.
## 0.3.2
- Bump `babel-plugin-precompile-intl` to fix bug when ICU string start with an expression but end with something else.
## 0.3.1
- Update `precompile-intl-runtime` to 0.4.2 which allows for the `getLocaleFromNavigator` function to receive an optional parameter that is the value to return when SSR'ing.

## 0.3.0

- Add two versions of the SvelteKit plugin: One in ES6 module syntax ending in `.js` and one in commonJS ending in `.cjs`.