import { StyleSheet, Text, View } from 'react-native';
import { color, font, radius, sp } from '../design';
import type { DayCell } from '../domain/projections/challenge-calendar';

/** Thirty cells, six across. Lit is volt; today is outlined; missed is a rest mark. */
export function CalendarGrid({ cells }: { cells: readonly DayCell[] }) {
  return (
    <View style={styles.grid} accessibilityRole="summary" accessibilityLabel={describe(cells)}>
      {cells.map((cell, i) => (
        <View key={i} style={[styles.cell, cellStyles[cell]]}>
          <Text
            style={[
              styles.day,
              cell === 'lit' && styles.dayLit,
              cell === 'future' && styles.dayFuture,
            ]}
          >
            {i + 1}
          </Text>
        </View>
      ))}
    </View>
  );
}

function describe(cells: readonly DayCell[]): string {
  const lit = cells.filter((c) => c === 'lit').length;
  const missed = cells.filter((c) => c === 'missed').length;
  return `${lit} days counted, ${missed} rest days, ${cells.length} days total`;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp(1) },
  cell: {
    width: '15%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
  },
  day: { fontFamily: font.display, fontSize: 16, color: color.textSecondary },
  dayLit: { color: color.background },
  dayFuture: { opacity: 0.45 },
});

const cellStyles = StyleSheet.create({
  lit: { backgroundColor: color.accent },
  today: { borderWidth: 2, borderColor: color.accent },
  missed: { backgroundColor: color.surface, opacity: 0.7 },
  future: {},
});
