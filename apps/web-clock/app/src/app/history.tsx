import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import {
  Body,
  Button,
  color,
  Label,
  Numeral,
  radius,
  Row,
  Screen,
  sp,
  Title,
  type,
} from '../design';
import {
  finishedSessions,
  personalBest,
  type SessionSummary,
} from '../domain/projections/sessions';
import { formatScore } from '../domain/workout/cindy';
import { useEvents } from '../lib/use-events';
import { planLabel } from '../ui/day-card';

/** Every finished 20:00, newest first. Free in v1.0 (decision P8). */
export default function History() {
  const router = useRouter();
  const events = useEvents();
  const sessions = finishedSessions(events);
  const best = personalBest(sessions);

  return (
    <Screen>
      <View style={styles.header}>
        <Row style={styles.between}>
          <Label tone="accent">History</Label>
          <Button label="Back" kind="ghost" compact onPress={() => router.back()} />
        </Row>
        <Title>
          {sessions.length === 0 ? 'Nothing counted yet.' : `${sessions.length} sessions.`}
        </Title>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.sessionId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SessionRow
            session={item}
            isBest={best?.sessionId === item.sessionId}
            onPress={() =>
              router.push({
                pathname: '/summary/[sessionId]',
                params: { sessionId: item.sessionId },
              })
            }
          />
        )}
        ListEmptyComponent={
          <Body tone="secondary" style={styles.empty}>
            Finish a 20:00 and it lands here with its card.
          </Body>
        }
      />
    </Screen>
  );
}

function SessionRow({
  session,
  isBest,
  onPress,
}: {
  session: SessionSummary;
  isBest: boolean;
  onPress: () => void;
}) {
  const date = new Date(session.startedAt);
  const when = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowLeft}>
        <Row>
          <Label tone="primary">{session.dayIndex ? `Day ${session.dayIndex}` : 'Single'}</Label>
          <Label>{when}</Label>
          {isBest ? <Label tone="accent">best</Label> : null}
          {session.early ? <Label tone="danger">early</Label> : null}
        </Row>
        <Label>{planLabel(session.plan)}</Label>
      </View>
      <Numeral size={type.scale.display}>
        {formatScore(session.rounds, session.leftoverReps)}
      </Numeral>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { padding: sp(5), gap: sp(2) },
  between: { justifyContent: 'space-between' },
  list: { paddingHorizontal: sp(5), paddingBottom: sp(6), gap: sp(2) },
  row: {
    backgroundColor: color.surface,
    borderRadius: radius.medium,
    padding: sp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { gap: sp(1) },
  pressed: { opacity: 0.8 },
  empty: { paddingTop: sp(4) },
});
