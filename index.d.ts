export * from 'precompile-intl-runtime';

declare module '$locales' {
  export * from 'precompile-intl-runtime'

  const availableLocales: string[]

  export default availableLocales
}
