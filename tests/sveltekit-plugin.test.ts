import { describe, it, expect } from 'vitest'
import svelteIntlPrecompile from '../sveltekit-plugin';

describe('suite', () => {
  it('serial test', async () => { 
    expect(svelteIntlPrecompile).toBeTruthy();
  })
});