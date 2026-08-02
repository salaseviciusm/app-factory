import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateBrandPack, tokensSchema } from '../src/brand-pack-schema.js';
import { renderTokens } from '../src/generate-tokens.js';

const here = dirname(fileURLToPath(import.meta.url));
const examplePack = join(here, '..', '..', 'spec-scaffold', 'brand-pack');

function loadExample(): { tokens: unknown; identity: unknown; features: unknown } {
  const read = (f: string): unknown =>
    JSON.parse(readFileSync(join(examplePack, f), 'utf8')) as unknown;
  return {
    tokens: read('tokens.json'),
    identity: read('identity.json'),
    features: read('features.json'),
  };
}

describe('brand pack validation', () => {
  it('the shipped example brand pack is valid', () => {
    const pack = validateBrandPack(loadExample());
    expect(pack.identity.codename).toBe('example');
    expect(pack.features.monetization.entitlement).toBe('pro');
  });

  it('rejects analytics without an activation event', () => {
    const raw = loadExample();
    const features = raw.features as { analytics: { activationEvent?: string } };
    delete features.analytics.activationEvent;
    expect(() => validateBrandPack(raw)).toThrow(/activationEvent/);
  });

  it('rejects both-modes tokens without light overrides', () => {
    const raw = loadExample();
    const tokens = raw.tokens as { modes: string; color: { light?: unknown } };
    tokens.modes = 'both';
    delete tokens.color.light;
    expect(() => validateBrandPack(raw)).toThrow(/light/);
  });
});

describe('token generation', () => {
  it('renders a tokens file with role doc comments and no hand-editing invitation', () => {
    const tokens = tokensSchema.parse(loadExample().tokens);
    const rendered = renderTokens(tokens);
    expect(rendered).toContain('GENERATED from brand-pack/tokens.json');
    expect(rendered).toContain("accent: '");
    expect(rendered).toContain('as const');
    // every color carries its role as a doc comment
    expect(rendered).toMatch(/\/\*\* .+ \*\/\n {2}accent:/);
  });
});
