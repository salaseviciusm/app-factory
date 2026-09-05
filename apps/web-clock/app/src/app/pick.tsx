import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { appContext } from '../context/app-context';
import {
  Body,
  Button,
  color,
  Label,
  Numeral,
  Row,
  Screen,
  sp,
  Title,
  radius,
  type,
} from '../design';
import { toIsoDate } from '../domain/challenge/dates';
import type {
  PullupVariant,
  PushupVariant,
  SquatVariant,
  VariantPlan,
} from '../domain/detectors/detector';
import { foldSettings } from '../domain/projections/settings';
import { challengeStarted, targetChanged } from '../domain/workout/events';
import { useEvents } from '../lib/use-events';

/** Screenshot 2: "Start where you are." Scaled versions are first-class, chosen on day 1. */
export default function Pick() {
  const router = useRouter();
  const events = useEvents();
  const settings = foldSettings(events);
  const [plan, setPlan] = useState<VariantPlan>(settings.plan);
  const [target, setTarget] = useState(settings.targetRounds);

  const start = () => {
    const challengeId = appContext.newId();
    if (target !== settings.targetRounds) {
      appContext.bus.publish(targetChanged.create(appContext, { targetRounds: target }));
    }
    appContext.bus.publish(
      challengeStarted.create(appContext, {
        challengeId,
        kind: 'winter-arc-30',
        startDate: toIsoDate(appContext.clock()),
        days: 30,
        minSessionsPerWeek: 5,
        plan,
      }),
    );
    router.replace({ pathname: '/session', params: { challengeId, dayIndex: '1' } });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Label tone="accent">Pick your version</Label>
        <Title>Start where you are.</Title>
        <Body tone="secondary">
          Every version counts and is named on your card. Switch to Rx on any day from settings.
        </Body>

        <Choice<PullupVariant>
          label="Pull-ups"
          value={plan.pullup}
          options={[
            ['jumping', 'Jumping pull-ups', 'Feet leave the floor, chin clears the bar'],
            ['rx', 'Pull-ups', 'Dead hang to chin over the bar'],
          ]}
          onChange={(pullup) => setPlan({ ...plan, pullup })}
        />
        <Choice<PushupVariant>
          label="Push-ups"
          value={plan.pushup}
          options={[
            ['knee', 'Knee push-ups', 'Knees down, chest to the floor, lock out'],
            ['rx', 'Push-ups', 'Plank, chest to the floor, lock out'],
          ]}
          onChange={(pushup) => setPlan({ ...plan, pushup })}
        />
        <Choice<SquatVariant>
          label="Squats"
          value={plan.squat}
          options={[
            ['box', 'Box squats', 'Sit to a box or chair, stand tall'],
            ['rx', 'Air squats', 'Hips below the knees, stand tall'],
          ]}
          onChange={(squat) => setPlan({ ...plan, squat })}
        />

        <View style={styles.target}>
          <Label>Target rounds (optional)</Label>
          <Row style={styles.targetRow}>
            <Button
              label="−"
              kind="secondary"
              compact
              onPress={() => setTarget(Math.max(1, target - 1))}
              accessibilityLabel="Lower target"
            />
            <Numeral size={type.scale.display}>{target}</Numeral>
            <Button
              label="+"
              kind="secondary"
              compact
              onPress={() => setTarget(Math.min(60, target + 1))}
              accessibilityLabel="Raise target"
            />
          </Row>
          <Body tone="secondary">27 is the number the internet argues about. Yours is yours.</Body>
        </View>

        <Button label="Suit up" onPress={start} />
        <Button label="Back" kind="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function Choice<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: ReadonlyArray<readonly [V, string, string]>;
  onChange: (v: V) => void;
}) {
  return (
    <View style={styles.choice}>
      <Label>{label}</Label>
      {options.map(([key, title, hint]) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Body strong>{title}</Body>
            <Body tone="secondary" style={styles.hint}>
              {hint}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: sp(5), gap: sp(4) },
  choice: { gap: sp(2) },
  option: {
    backgroundColor: color.surface,
    borderRadius: radius.medium,
    padding: sp(3),
    borderWidth: 2,
    borderColor: color.surface,
  },
  optionSelected: { borderColor: color.accent },
  hint: { fontSize: type.scale.caption + 1, lineHeight: (type.scale.caption + 1) * 1.4 },
  target: { gap: sp(2) },
  targetRow: { gap: sp(4) },
});
