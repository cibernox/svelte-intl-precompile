declare module 'svelte-intl-precompile' {
  export * from 'precompile-intl-runtime';
}

declare module '$locales' {
  /** Registers all locales found in `localesRoot`. */
  export const registerAll: () => void

  /** A list of all locales that will be registered by {@link registerAll()}. */
  export const availableLocales: string[]
}
