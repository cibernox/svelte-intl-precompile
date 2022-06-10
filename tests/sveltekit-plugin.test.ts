import { beforeEach, describe, it, expect, vi } from 'vitest'
import svelteIntlPrecompile from '../sveltekit-plugin';

vi.mock('path', () => ({
  resolve(path) {
    return 'fakeroot/' + path;
  },
  extname(filename) {
    return '.' + filename.split('.')[1];
  },
  basename(filename) {
    return filename.split('.')[0];
  },
}));

vi.mock('fs/promises', () => ({
  readdir() {
    return Promise.resolve().then(() => ['en-US.json', 'en.json', 'es.json'])
  },
}));

describe('imports', () => {
  // beforeEach(() => {

  // });

  it('$locales returns a module that is aware of all the available locales', async () => { 
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
});

function singleLineString([str]: TemplateStringsArray) {
  let lines: string[] = str.split('\n');
  if (lines[0] === '') {
    lines = lines.splice(1);
  }
  let firstLineSpaces = lines[0].search(/\S|$/);
  return lines.map(l => l.substring(firstLineSpaces)).join('\n');
}