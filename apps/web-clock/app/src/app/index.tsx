import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { appContext } from '../context/app-context';
import {
  Body,
  Button,
  Display,
  Label,
  Numeral,
  Panel,
  Row,
  Screen,
  sp,
  Stat,
  Title,
  type,
} from '../design';
import { toIsoDate } from '../domain/challenge/dates';
import {
  activeChallenge,
  calendarCells,
  challengeStatusOn,
  paceSummary,
  type ChallengeState,
} from '../domain/projections/challenge-calendar';
import { finishedSessions, personalBest } from '../domain/projections/sessions';
import { dayIndexFor } from '../domain/challenge/dates';
import { challengeAbandoned } from '../domain/workout/events';
import { useEvents } from '../lib/use-events';
import { CalendarGrid } from '../ui/calendar-grid';

export default function Home() {
  const events = useEvents();
  const challenge = activeChallenge(events);
  const today = toIsoDate(appContext.clock());
  const status = challenge ? challengeStatusOn(challenge, today) : undefined;

  if (!challenge || status === 'abandoned') {
    return <Landing />;
  }
  if (status === 'complete' || status === 'ended') {
    return <Finished challenge={challenge} />;
  }
  return <Calendar challenge={challenge} today={today} />;
}

function Landing() {
  const router = useRouter();
  const events = useEvents();
  const sessions = finishedSessions(events);
  return (
    <Screen>
      <View style={styles.landing}>
        <View style={styles.hero}>
          <Label tone="accent">30 days · one workout</Label>
          <Display style={styles.heroTitle}>Suit Up.</Display>
          <Body tone="secondary">
            Twenty minutes. Five pull-ups, ten push-ups, fifteen squats, as many rounds as you can.
            The camera counts. A day only lights when it saw you finish.
          </Body>
        </View>
        <View style={styles.actions}>
          <Button label="Start the 30 days" onPress={() => router.push('/pick')} />
          <Button
            label="Just do today's 20:00"
            kind="secondary"
            onPress={() => router.push({ pathname: '/session', params: { mode: 'single' } })}
          />
          <Row style={styles.links}>
            {sessions.length > 0 ? (
              <Button
                label="History"
                kind="ghost"
                compact
                onPress={() => router.push('/history')}
              />
            ) : null}
            <Button
              label="Settings"
              kind="ghost"
              compact
              onPress={() => router.push('/settings')}
            />
          </Row>
        </View>
      </View>
    </Screen>
  );
}

function Calendar({ challenge, today }: { challenge: ChallengeState; today: string }) {
  const router = useRouter();
  const events = useEvents();
  const cells = calendarCells(challenge, today);
  const dayIndex = dayIndexFor(challenge.startDate, today, challenge.days) ?? challenge.days;
  const pace = paceSummary(challenge, today);
  const litToday = challenge.daysLit.has(dayIndex);
  const missed = cells.filter((c) => c === 'missed').length;
  const sessions = finishedSessions(events).filter(
    (s) => s.challengeId === challenge.challengeId && !s.early,
  );
  const last = sessions[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Row style={styles.between}>
          <Label tone="accent">{`Day ${dayIndex} of ${challenge.days}`}</Label>
          <Button label="Settings" kind="ghost" compact onPress={() => router.push('/settings')} />
        </Row>
        <CalendarGrid cells={cells} />
        <Row style={styles.stats}>
          <Stat value={pace.lit} label="counted" />
          <Stat value={missed} label="rest" />
          <Stat
            value={
              challenge.firstRounds !== undefined && last
                ? `${challenge.firstRounds} → ${last.rounds}`
                : (last?.rounds ?? '—')
            }
            label="rounds"
          />
        </Row>
        <Panel>
          <Label>the rule</Label>
          <Body>
            {`Five of seven days counted. Rest is a rule, not a failure. You are ${pace.lit >= pace.expected ? 'on' : 'behind'} pace: ${pace.lit} counted, ${pace.expected} expected by today.`}
          </Body>
        </Panel>
        <View style={styles.actions}>
          <Button
            label={litToday ? 'Counted today · go again' : 'Suit up'}
            onPress={() =>
              router.push({
                pathname: '/session',
                params: { challengeId: challenge.challengeId, dayIndex: String(dayIndex) },
              })
            }
          />
          <Row style={styles.links}>
            <Button label="History" kind="ghost" compact onPress={() => router.push('/history')} />
            <Button
              label="Leave the challenge"
              kind="ghost"
              compact
              onPress={() =>
                appContext.bus.publish(
                  challengeAbandoned.create(appContext, { challengeId: challenge.challengeId }),
                )
              }
            />
          </Row>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Finished({ challenge }: { challenge: ChallengeState }) {
  const router = useRouter();
  const events = useEvents();
  const sessions = finishedSessions(events).filter(
    (s) => s.challengeId === challenge.challengeId && !s.early,
  );
  const best = personalBest(sessions);
  const first = challenge.firstRounds ?? 0;
  const lastRounds = challenge.lastRounds ?? sessions[0]?.rounds ?? 0;
  return (
    <Screen>
      <View style={styles.landing}>
        <View style={styles.hero}>
          <Label tone="accent">
            {challenge.status === 'complete' ? '30 days · complete' : '30 days · ended'}
          </Label>
          <Row style={styles.compare}>
            <View>
              <Numeral size={type.scale.counter} tone="secondary">
                {first}
              </Numeral>
              <Label>day 1</Label>
            </View>
            <Title>→</Title>
            <View>
              <Numeral size={type.scale.counter}>{lastRounds}</Numeral>
              <Label>last</Label>
            </View>
          </Row>
          <Body tone="secondary">{`${challenge.daysLit.size} of ${challenge.days} days counted.${best ? ` Best: ${best.rounds} rounds.` : ''}`}</Body>
        </View>
        <View style={styles.actions}>
          <Button label="Start another 30" onPress={() => router.push('/pick')} />
          <Button label="History" kind="secondary" onPress={() => router.push('/history')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  landing: { flex: 1, padding: sp(5), justifyContent: 'space-between' },
  hero: { gap: sp(3), paddingTop: sp(7) },
  heroTitle: { fontSize: 56, lineHeight: 60 },
  actions: { gap: sp(2) },
  links: { justifyContent: 'center', flexWrap: 'wrap' },
  scroll: { padding: sp(5), gap: sp(4) },
  between: { justifyContent: 'space-between' },
  stats: { justifyContent: 'space-between', gap: sp(4) },
  compare: { gap: sp(4), alignItems: 'flex-end' },
});
