## 0.3.2
- Bump `babel-plugin-precompile-intl` to fix bug when ICU string start with an expression but end with something else.
## 0.3.1
- Update `precompile-intl-runtime` to 0.4.2 which allows for the `getLocaleFromNavigator` function to receive an optional parameter that is the value to return when SSR'ing.

## 0.3.0

- Add two versions of the SvelteKit plugin: One in ES6 module syntax ending in `.js` and one in commonJS ending in `.cjs`.