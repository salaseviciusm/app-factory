// GENERATED from brand-pack/tokens.json — do not edit by hand.
// Change the brand pack and re-run: npm run generate-tokens

export const color = {
  /** The room — graphite, no blue wash (that is skip-hero) */
  background: '#0f1013',
  /** Raised HUD chrome, cards, the calendar */
  surface: '#16171c',
  /** Primary reading and live numbers */
  textPrimary: '#eef0f4',
  /** Labels, secondary copy, unlit days */
  textSecondary: '#9a9ea8',
  /** Volt — the only colour that means counted: the rep, the lit day, the bar */
  accent: '#d4ff3f',
  /** Not counted, and destructive actions */
  danger: '#ff5f4a',
  /** Framing lock — we can see you */
  success: '#d4ff3f',
} as const;

// Single-mode brand ('dark') — no light overrides.
export const lightColor = null;

export const modes = 'dark' as const;

export const space = {
  /** base unit in px */
  unit: 4,
  scale: [4, 8, 12, 16, 24, 32, 48, 64],
} as const;

export const radius = {
  small: 8,
  medium: 14,
  large: 22,
} as const;

export const type = {
  fontFamily: 'Syne',
  /** live numbers use tabular numerals: true */
  tabularNumerals: true,
  scale: {
    caption: 12,
    body: 16,
    title: 22,
    display: 34,
    counter: 88,
  },
} as const;
