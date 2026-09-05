import type { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font } from './fonts';
import { color, radius, space, type } from './tokens.generated';

export const sp = (step: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): number => space.scale[step];

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function Panel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

/** Mono, uppercase, tracked: every label in the app. */
export function Label({
  children,
  tone = 'secondary',
  style,
}: PropsWithChildren<{
  tone?: 'primary' | 'secondary' | 'accent' | 'danger';
  style?: StyleProp<TextStyle>;
}>) {
  return <Text style={[styles.label, { color: toneColor(tone) }, style]}>{children}</Text>;
}

export function Body({
  children,
  tone = 'primary',
  strong = false,
  style,
}: PropsWithChildren<{
  tone?: 'primary' | 'secondary';
  strong?: boolean;
  style?: StyleProp<TextStyle>;
}>) {
  return (
    <Text style={[styles.body, strong && styles.bodyStrong, { color: toneColor(tone) }, style]}>
      {children}
    </Text>
  );
}

export function Title({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Display({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.display, style]}>{children}</Text>;
}

/** Big tabular numeral — the counter, the clock, the score. */
export function Numeral({
  children,
  size = type.scale.counter,
  tone = 'primary',
  style,
}: PropsWithChildren<{
  size?: number;
  tone?: 'primary' | 'secondary' | 'accent' | 'danger';
  style?: StyleProp<TextStyle>;
}>) {
  return (
    <Text
      style={[
        styles.numeral,
        { fontSize: size, lineHeight: size * 1.02, color: toneColor(tone) },
        style,
      ]}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled = false,
  compact = false,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        buttonStyles[kind],
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[styles.buttonLabel, compact && styles.buttonLabelCompact, buttonLabelStyles[kind]]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <View style={styles.stat}>
      <Numeral size={type.scale.display}>{value}</Numeral>
      <Label>{label}</Label>
    </View>
  );
}

function toneColor(tone: 'primary' | 'secondary' | 'accent' | 'danger'): string {
  switch (tone) {
    case 'primary':
      return color.textPrimary;
    case 'secondary':
      return color.textSecondary;
    case 'accent':
      return color.accent;
    case 'danger':
      return color.danger;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  panel: {
    backgroundColor: color.surface,
    borderRadius: radius.large,
    padding: sp(4),
    gap: sp(2),
  },
  label: {
    fontFamily: font.mono,
    fontSize: type.scale.caption,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: { fontFamily: font.body, fontSize: type.scale.body, lineHeight: type.scale.body * 1.5 },
  bodyStrong: { fontFamily: font.bodyStrong },
  title: {
    fontFamily: font.display,
    fontSize: type.scale.title,
    lineHeight: type.scale.title * 1.15,
    color: color.textPrimary,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: font.display,
    fontSize: type.scale.display,
    lineHeight: type.scale.display * 1.1,
    color: color.textPrimary,
    letterSpacing: -1,
  },
  numeral: { fontFamily: font.display, fontVariant: ['tabular-nums'], letterSpacing: -2 },
  button: {
    minHeight: 60,
    paddingHorizontal: sp(5),
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 46, paddingHorizontal: sp(3) },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: {
    fontFamily: font.display,
    fontSize: type.scale.body + 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonLabelCompact: { fontSize: type.scale.body - 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: sp(2) },
  stat: { gap: sp(0), minWidth: 72 },
});

const buttonStyles: Record<ButtonKind, ViewStyle> = {
  primary: { backgroundColor: color.accent },
  secondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: '#262831' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.danger },
};

const buttonLabelStyles: Record<ButtonKind, TextStyle> = {
  primary: { color: color.background },
  secondary: { color: color.textPrimary },
  ghost: { color: color.textSecondary },
  danger: { color: color.danger },
};
