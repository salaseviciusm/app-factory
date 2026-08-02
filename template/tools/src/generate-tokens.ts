/**
 * Brand pack → design tokens generator.
 *
 * Reads <brand-pack-dir>/tokens.json, validates it, and emits a tokens file for the
 * app shell (src/design/tokens.generated.ts). The generated file is the ONLY source
 * of colors/spacing/type in the app — zero raw hex/px in components.
 *
 * Usage: npm run generate-tokens -- <brand-pack-dir> <out-file>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokensSchema, type BrandTokens } from './brand-pack-schema.js';

export function renderTokens(tokens: BrandTokens): string {
  const lines: string[] = [];
  lines.push('// GENERATED from brand-pack/tokens.json — do not edit by hand.');
  lines.push('// Change the brand pack and re-run: npm run generate-tokens');
  lines.push('');
  lines.push('export const color = {');
  for (const [name, entry] of Object.entries(tokens.color)) {
    if (name === 'light' || entry === undefined) {
      continue;
    }
    const { value, role } = entry as { value: string; role: string };
    lines.push(`  /** ${role} */`);
    lines.push(`  ${name}: '${value}',`);
  }
  lines.push('} as const;');
  lines.push('');
  if (tokens.color.light) {
    lines.push('export const lightColor = {');
    for (const [name, entry] of Object.entries(tokens.color.light)) {
      lines.push(`  /** ${entry.role} */`);
      lines.push(`  ${name}: '${entry.value}',`);
    }
    lines.push('} as const;');
  } else {
    lines.push(`// Single-mode brand ('${tokens.modes}') — no light overrides.`);
    lines.push('export const lightColor = null;');
  }
  lines.push('');
  lines.push(`export const modes = '${tokens.modes}' as const;`);
  lines.push('');
  lines.push('export const space = {');
  lines.push(`  /** base unit in px */`);
  lines.push(`  unit: ${tokens.space.unit},`);
  lines.push(`  scale: [${tokens.space.scale.join(', ')}],`);
  lines.push('} as const;');
  lines.push('');
  lines.push('export const radius = {');
  lines.push(`  small: ${tokens.radius.small},`);
  lines.push(`  medium: ${tokens.radius.medium},`);
  lines.push(`  large: ${tokens.radius.large},`);
  lines.push('} as const;');
  lines.push('');
  lines.push('export const type = {');
  lines.push(`  fontFamily: '${tokens.type.fontFamily}',`);
  lines.push(`  /** live numbers use tabular numerals: ${tokens.type.tabularNumerals} */`);
  lines.push(`  tabularNumerals: ${tokens.type.tabularNumerals},`);
  lines.push('  scale: {');
  for (const [step, size] of Object.entries(tokens.type.scale)) {
    lines.push(`    ${step}: ${size},`);
  }
  lines.push('  },');
  lines.push('} as const;');
  lines.push('');
  return lines.join('\n');
}

export function generateTokensFile(brandPackDir: string, outFile: string): void {
  const raw: unknown = JSON.parse(readFileSync(join(brandPackDir, 'tokens.json'), 'utf8'));
  const tokens = tokensSchema.parse(raw);
  writeFileSync(outFile, renderTokens(tokens));
}

// CLI entry
const [, , brandPackDir, outFile] = process.argv;
if (brandPackDir && outFile) {
  generateTokensFile(brandPackDir, outFile);
  console.log(`tokens written: ${outFile}`);
} else if (process.argv[1]?.endsWith('generate-tokens.ts')) {
  console.error('usage: npm run generate-tokens -- <brand-pack-dir> <out-file>');
  process.exit(1);
}
