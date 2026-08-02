import { z } from 'zod';

/**
 * Machine-consumable halves of a brand pack (docs/04-template-brand-system.md).
 * The prose halves (brand.md, voice.md, marketing.md) are agent context, not config.
 */

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');

/** A color with its role documented — the doc comment lands in generated tokens.ts. */
const roleColor = z.object({
  value: hexColor,
  role: z.string().min(1, 'every color documents its role, not just its value'),
});

export const tokensSchema = z.object({
  /** 'dark' | 'light' | 'both'. A single-mode brand commits fully (skip-hero precedent). */
  modes: z.enum(['dark', 'light', 'both']),
  color: z.object({
    background: roleColor,
    surface: roleColor,
    textPrimary: roleColor,
    textSecondary: roleColor,
    accent: roleColor,
    danger: roleColor,
    success: roleColor,
    /** Light-mode overrides; required when modes is 'light' or 'both'. */
    light: z
      .object({
        background: roleColor,
        surface: roleColor,
        textPrimary: roleColor,
        textSecondary: roleColor,
      })
      .optional(),
  }),
  space: z.object({
    unit: z.number().int().positive().describe('base spacing unit in px'),
    scale: z.array(z.number().int().nonnegative()).min(4),
  }),
  radius: z.object({
    small: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    large: z.number().int().nonnegative(),
  }),
  type: z.object({
    fontFamily: z.string().min(1),
    scale: z.record(z.string(), z.number().positive()),
    /** Live numbers use tabular numerals (UX playbook rule 7). */
    tabularNumerals: z.boolean(),
  }),
});

export const identitySchema = z.object({
  /** Final brand name (stage 3 output) — home-screen label is ~11 visible chars. */
  name: z.string().min(1).max(30),
  /** Working codename, lowercase-hyphenated; never shown to users. */
  codename: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  /** Permanent. Pick it like it can never change — it can't. */
  bundleId: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/),
  scheme: z.string().regex(/^[a-z][a-z0-9]*$/),
  store: z.object({
    title: z.string().max(30),
    subtitle: z.string().max(30),
    primaryKeywordPhrase: z.string().min(1),
  }),
});

export const featuresSchema = z.object({
  onboarding: z.object({
    enabled: z.boolean(),
    steps: z.array(z.string()).default([]),
  }),
  monetization: z.object({
    model: z.enum(['subscription', 'lifetime', 'ads-plus-iap', 'freemium', 'free']),
    entitlement: z.string().default('pro'),
    paywallPlacement: z.enum(['post-aha', 'onboarding', 'feature-gate']),
  }),
  analytics: z.object({
    enabled: z.boolean(),
    /** Per-app events (category-entity-action); standard events are always wired. */
    events: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)+$/)).default([]),
    activationEvent: z.string().optional(),
    habitEvent: z.string().optional(),
  }),
  notifications: z.object({ enabled: z.boolean() }),
  reviewPrompt: z.object({
    enabled: z.boolean(),
    milestoneEvent: z.string().optional(),
  }),
});

export type BrandTokens = z.infer<typeof tokensSchema>;
export type BrandIdentity = z.infer<typeof identitySchema>;
export type BrandFeatures = z.infer<typeof featuresSchema>;

export interface BrandPack {
  tokens: BrandTokens;
  identity: BrandIdentity;
  features: BrandFeatures;
}

export function validateBrandPack(raw: {
  tokens: unknown;
  identity: unknown;
  features: unknown;
}): BrandPack {
  const tokens = tokensSchema.parse(raw.tokens);
  const identity = identitySchema.parse(raw.identity);
  const features = featuresSchema.parse(raw.features);

  if ((tokens.modes === 'light' || tokens.modes === 'both') && !tokens.color.light) {
    throw new Error(`tokens.modes is '${tokens.modes}' but color.light overrides are missing`);
  }
  if (features.analytics.enabled && !features.analytics.activationEvent) {
    throw new Error(
      'analytics.activationEvent is required when analytics is enabled — ' +
        "if you can't name the aha moment, the spec isn't done (playbooks/analytics-taxonomy.md)",
    );
  }
  return { tokens, identity, features };
}
