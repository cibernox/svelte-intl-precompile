type Transformer = (
  content: string,
  options: { filename: string, basename: string, extname: string }
) => string | PromiseLike<string>

interface Options {
  prefix?: string
  exclude?: RegExp | ((filename: string) => boolean)
  transformers?: Record<string, Transformer>
}

type VitePlugin = any

interface SvelteIntlPrecompile {
  (localesRoot: string, prefix?: string): VitePlugin
  (localesRoot: string, options?: Options): VitePlugin

  transformCode: typeof transformCode
}

export function transformCode(code: string, options?: Record<string, any>): string

declare const svelteIntlPrecompile: SvelteIntlPrecompile

export default svelteIntlPrecompile
