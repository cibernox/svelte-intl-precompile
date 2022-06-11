import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import svelteIntlPrecompile from '../sveltekit-plugin';

const enJsonTranslations = singleLineString`
{
  "simple": "Simple string",
  "interpolated": "String with one {value} interpolated"
}`;
const esJsonTranslations = singleLineString`
{
  "simple": "Cadena simple",
  "interpolated": "Cadena con un {value} interpolado"
}`;
const glYamlTranslations = singleLineString`
  simple: "Cadea simple"
  interpolated: "Cadea con un {value} interpolado"`;
const translationFiles = {
  'fakeroot/locales/en.json': enJsonTranslations,
  'fakeroot/locales/es.json': esJsonTranslations,
  'fakeroot/locales/gl.yaml': glYamlTranslations,
}

beforeEach(() => {
  vi.mock('path', () => ({
    resolve(...paths) {
      return ['fakeroot', ...paths].join('/');
    },
    extname(filename) {
      const ext = filename.split('.')[1];
      return ext && ('.' + ext);
    },
    basename(filename) {
      return filename.split('.')[0];
    },
  }));
  
  vi.mock('fs/promises', () => ({
    readdir() {
      return Promise.resolve().then(() => ['en-US.json', 'en.json', 'es.json'])
    },
    readFile(filename) {
      const content = translationFiles[filename];
      if (content) return content;
      let error = new Error('File not found');
      (error as any).code = 'ENOENT';
      throw error;
    }
  }));
});

afterEach(() => {
  vi.clearAllMocks()
})

describe('imports', () => {
  it('`$locales` returns a module that is aware of all the available locales', async () => { 
    const plugin = svelteIntlPrecompile('locales');
    const content = await plugin.load('$locales');
    expect(content).toBe(singleLineString`
    import { register } from 'svelte-intl-precompile'
    export function registerAll() {
      register("en-US", () => import("$locales/en-US"))
      register("en", () => import("$locales/en"))
      register("es", () => import("$locales/es"))
    }
    export const availableLocales = ["en","es","en-US"]`)
  });

  it('`$locales/en` returns the translations for that language', async () => { 
    const plugin = svelteIntlPrecompile('locales');
    const content = await plugin.load('$locales/en');
    expect(content).toBe(singleLineString`
      import { __interpolate } from "svelte-intl-precompile";
      export default {
        "simple": "Simple string",
        "interpolated": value => \`String with one \${__interpolate(value)} interpolated\`
      };`
    );

  });

  it('`$locales/es` returns the translations for that language', async () => { 
    const plugin = svelteIntlPrecompile('locales');
    const content = await plugin.load('$locales/es');
    expect(content).toBe(singleLineString`
      import { __interpolate } from "svelte-intl-precompile";
      export default {
        "simple": "Cadena simple",
        "interpolated": value => \`Cadena con un \${__interpolate(value)} interpolado\`
      };`
    );
  });

  it('supports yaml files', async () => { 
    const plugin = svelteIntlPrecompile('locales');
    const content = await plugin.load('$locales/gl');
    expect(content).toBe(singleLineString`
      import { __interpolate } from "svelte-intl-precompile";
      export default {
        "simple": "Cadea simple",
        "interpolated": value => \`Cadea con un \${__interpolate(value)} interpolado\`
      };`
    );
  });
});

function singleLineString([str]: TemplateStringsArray) {
  let lines: string[] = str.split('\n');
  if (lines[0] === '') {
    lines = lines.splice(1);
  }
  let firstLineSpaces = lines[0].search(/\S|$/);
  return lines.map(l => l.substring(firstLineSpaces)).join('\n');
}