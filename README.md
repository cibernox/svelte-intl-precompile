![Svelte Intl Precompile](https://raw.githubusercontent.com/cibernox/svelte-intl-precompile/main/logos/svelte-intl-precompile-double-line.svg)

## Svelte-intl-precompile

This i18n library for Svelte.js has an API identical (or at least very similar) to https://github.com/kaisermann/svelte-i18n but has
a different approach to processing translations.

Instead of doing all the work in the client, much like Svelte.js acts as a compiler for your app, this library acts as a compiler
for your translations.

## Check the documentation page, it's better than this Readme

Go to [https://svelte-intl-precompile.com](https://svelte-intl-precompile.com)

Still, there you have the rest of the Readme.

### Why would I want to use it? How does it work?
This approach is different than the taken by libraries like intl-messageformat or format-message, which do all the work in the browser. The approach taken by those libraries is more flexible as you can just load json files with translations in plain text and that's it, but it also means the library needs to ship a parser for the ICU message syntax, and it always has to have ship code for all the features that the ICU syntax supports, even features you might not use, making those libraries several times bigger.

This process spares the browser of the burden of doing the same process in the user's devices, resulting in smaller and faster apps.

For instance if an app has the following set of translations:
```json
{
  "plain": "Some text without interpolations",
  "interpolated": "A text where I interpolate {count} times",
  "time": "Now is {now, time}",
  "number": "My favorite number is {n, number}",
  "pluralized": "I have {count, plural,=0 {no cats} =1 {one cat} other {{count} cats}}",
  "pluralized-with-hash": "I have {count, plural, zero {no cats} one {just # cat} other {# cats}}",
  "selected": "{gender, select, male {He is a good boy} female {She is a good girl} other {They are good fellas}}",
  "numberSkeleton": "Your account balance is {n, number, ::currency/CAD sign-always}",
  "installProgress": "{progress, number, ::percent scale/100 .##} completed"
}
```

The babel plugin will analyze and understand the strings in the ICU message syntax and transform them into something like:
```js
import { __interpolate, __number, __plural, __select, __time } from "precompile-intl-runtime";
export default {
  plain: "Some text without interpolations",
  interpolated: count => `A text where I interpolate ${__interpolate(count)} times`,
  time: now => `Now is ${__time(now)}`,
  number: n => `My favorite number is ${__number(n)}`,
  pluralized: count => `I have ${__plural(count, { 0: "no cats", 1: "one cat", h: `${__interpolate(count)} cats`})}`,
  "pluralized-with-hash": count => `I have ${__plural(count, { z: "no cats", o: `just ${count} cat`, h: `${count} cats`})}`,
  selected: gender => __select(gender, { male: "He is a good boy", female: "She is a good girl", other: "They are good fellas"}),
  numberSkeleton: n => `Your account balance is ${__number(n, { style: 'currency', currency: 'CAD', signDisplay: 'always' })}`,
  installProgress: progress => `${__number(progress / 100, { style: 'percent', maximumFractionDigits: 2 })} completed`
}
```

Now the translations are either strings or functions that take some arguments and generate strings using some utility helpers. Those utility helpers are very small and use the native Intl API available in all modern browsers and in node. Also, unused helpers are tree-shaken by rollup.

When the above code is minified it will results in an output that compact that often is shorter than the original ICU string:

```
"pluralized-with-hash": "I have {count, plural, zero {no cats} one {just # cat} other {# cats}}",
--------------------------------------------------------------------------------------------------
"pluralized-with-hash":t=>`I have ${jt(t,{z:"no cats",o:`just ${t} cat`,h:`${t} cats`})}`
```

The combination of a very small and treeshakeable runtime with moving the parsing into the build step results in an extremely small footprint and
extremely fast performance.

**How small, you may ask?** 
Usually adds less than 2kb to your final build size after compression and minification, when compared with nearly 15kb that alternatives with
a runtime ICU-message parser like `svelte-i18n` add.

**How fast, you may also ask?** 
When rendering a key that has also been rendered before around 25% faster. For initial rendering or rendering a keys that haven't been rendered 
before, around 400% faster.

### Setup
First of all, you can find a working sveltekit app configured to use `svelte-intl-precompile` in https://github.com/cibernox/sample-app-svelte-intl-precompile.
If you struggle with any of the following steps you can always use that app to compare it with yours:

1. Install `svelte-intl-precompile` as a runtime dependency.

2. Create a folder to put your translations. I like to use a `/messages` or `/locales` folder on the root. On that folder, create `en.json`, `es.json` (you can also create JS files exporting objects with the translations) and as many files as languages you want. On each file, export an object with your translations:
```json
{
  "recent.aria": "Find recently viewed tides",
  "menu": "Menu",
  "foot": "{count} {count, plural, =1 {foot} other {feet}}",
}
```

3. In your `svelte.config.js` import the function exported by `svelte-intl-precompile/sveltekit-plugin` and invoke with the folder where you've placed
your translation files it to your list of Vite plugins:
```js
import precompileIntl from "svelte-intl-precompile/sveltekit-plugin";

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
  kit: {
    target: '#svelte',
    vite: {
      plugins: [
        // if your translations are defined in /locales/[lang].js
        precompileIntl('locales')
        // precompileIntl('locales', '$myprefix') // also you can change import path prefix for json files ($locales by default)
      ]
    }
  }
};
```

If you are using CommonJS, you can instead use `const precompileIntl = require("svelte-intl-precompile/sveltekit-plugin");`.

From this step onward the library almost identical to use and configure to the popular `svelte-i18n`. It has the same features and only the import path is different. You can check the docs of `svelte-i18n` for examples and details in the configuration options.

4. Now you need some initialization code to register your locales and configure your preferences. You can import your languages statically (which will add them to your bundle) or register loaders that will load the translations lazily. The best place to put this configuration is inside a `<script context="module">` on your `src/$layout.svelte`
```html
<script>
  import { addMessages, init, getLocaleFromNavigator /*, register */ } from 'svelte-intl-precompile';
  import en from '$locales/en.js';  // If using typescript you can also use the .ts extension.
  import es from '$locales/es.js'   // load from $myprefix/es.js you configured a custom import path.
  // if you put your translations in js files, import then usin the relative path. E.g. `import en from '../../locales/en.js'`
  // @ts-ignore
  addMessages('en', en);
  addMessages('es', es);
  // register('es', () => import('$locales/es.js')); <-- use this approach if you want locales to be load lazily

  init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator()
  });
</script>

<script>
  import '../app.css';
</script>

<slot />
```

5. Now on your `.svelte` files you start translating using the `t` store exported from `svelte-intl-precompile`:
```html
<script>
	import { t } from 'svelte-intl-precompile'
</script>
<footer class="l-footer">
	<p class="t-footer">{$t("hightide")} {$t("footer.cta")}</p>
</footer>
```


## Note for automatic browser locale detection when server side rendering

If you want to automatically detect your user's locale from the browser using `getLocaleFromNavigator()` but you are
server side rendering your app (which sveltekit does by default), you need to take some extra steps for the
locale used when SSR matches the locale when hydrating the app which would cause texts to change.

You can pass to `getLocaleFromNavigator` an optional argument which is the locale to use when SSR'ing your app.
How you get that value depends on how you run your app, but for instance using sveltekit you can extract it from the
`accept-language` HTTP header of the request, using [Hooks](https://kit.svelte.dev/docs#hooks)

You can use `getSession` to extract the preferred locale from the request headers and store it in the session object,
which is made available to the client:
```js
// src/hooks.js
export function getSession(request) {
  let acceptedLanguage = request.headers["accept-language"] && request.headers["accept-language"].split(',')[0];`
  return { acceptedLanguage };
}
```

Then you can use the `session` store to pass it to the `init` function:
```html
<!-- __layout.svelte -->
<script context="module">
  import { register, init, waitLocale, getLocaleFromNavigator } from 'svelte-intl-precompile';
  register('en', () => import('$locales/en-us'));
  register('en-US', () => import('$locales/en-US'));
  register('es-GB', () => import('$locales/es-GB'));	
	
  export async function load({session}) {
    init({
      fallbackLocale: 'en',
      initialLocale: session.acceptedLanguage || getLocaleFromNavigator(),
    });
    await waitLocale(); // awaits for initialLocale language pack to finish loading;
    return {};
  }
</script>
```

If you have a lot of languages or want to register all available languages, you can use the `registerAll` function:

```html
<!-- __layout.svelte -->
<script context="module">
  import { register, init, waitLocale, getLocaleFromNavigator } from 'svelte-intl-precompile';
  import { registerAll } from '$locales';

  // Equivalent to a `register("lang", () => import('$locales/lang'))` fro each lang file in localesRoot.
  registerAll();

  export async function load({session}) {
    init({
      fallbackLocale: 'en',
      initialLocale: session.acceptedLanguage || getLocaleFromNavigator(),
    });
    await waitLocale(); // awaits for initialLocale language pack to finish loading;
    return {};
  }
</script>
```
