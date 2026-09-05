import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { appContext } from '../context/app-context';
import {
  Body,
  Button,
  color,
  Label,
  Numeral,
  Panel,
  radius,
  Row,
  Screen,
  sp,
  Title,
  type,
} from '../design';
import type { PoseSourceKind } from '../domain/pose/pose-source';
import { foldSettings } from '../domain/projections/settings';
import { cameraChanged, dataErased, planChanged, targetChanged } from '../domain/workout/events';
import { useCell } from '../lib/use-cell';
import { useEvents } from '../lib/use-events';
import { LivePoseSource } from '../impl/live-pose-source';

export default function Settings() {
  const router = useRouter();
  const events = useEvents();
  const settings = foldSettings(events);
  const sourceKind = useCell(appContext.poseSourceKind);

  const setTarget = (targetRounds: number) =>
    appContext.bus.publish(targetChanged.create(appContext, { targetRounds }));
  const setPlan = (plan: typeof settings.plan) =>
    appContext.bus.publish(planChanged.create(appContext, { plan }));
  const setCamera = (facing: 'front' | 'back') =>
    appContext.bus.publish(cameraChanged.create(appContext, { facing }));

  const erase = () =>
    Alert.alert('Erase everything?', 'Every session, every lit day. This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: () => {
          appContext.store.wipe();
          appContext.bus.publish(dataErased.create(appContext, {}));
          router.replace('/');
        },
      },
    ]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Row style={styles.between}>
          <Label tone="accent">Settings</Label>
          <Button label="Done" kind="ghost" compact onPress={() => router.back()} />
        </Row>

        <Panel>
          <Label>Target rounds</Label>
          <Row style={styles.targetRow}>
            <Button
              label="−"
              kind="secondary"
              compact
              onPress={() => setTarget(Math.max(1, settings.targetRounds - 1))}
              accessibilityLabel="Lower target"
            />
            <Numeral size={type.scale.display}>{settings.targetRounds}</Numeral>
            <Button
              label="+"
              kind="secondary"
              compact
              onPress={() => setTarget(Math.min(60, settings.targetRounds + 1))}
              accessibilityLabel="Raise target"
            />
          </Row>
        </Panel>

        <Panel>
          <Label>Your version</Label>
          <Segment
            options={[
              ['jumping', 'Jumping pull-ups'],
              ['rx', 'Pull-ups'],
            ]}
            value={settings.plan.pullup}
            onChange={(pullup) => setPlan({ ...settings.plan, pullup })}
          />
          <Segment
            options={[
              ['knee', 'Knee push-ups'],
              ['rx', 'Push-ups'],
            ]}
            value={settings.plan.pushup}
            onChange={(pushup) => setPlan({ ...settings.plan, pushup })}
          />
          <Segment
            options={[
              ['box', 'Box squats'],
              ['rx', 'Air squats'],
            ]}
            value={settings.plan.squat}
            onChange={(squat) => setPlan({ ...settings.plan, squat })}
          />
          <Body tone="secondary">
            Applies to your next session. Your card names the version you did.
          </Body>
        </Panel>

        <Panel>
          <Label>Camera</Label>
          <Segment
            options={[
              ['front', 'Front — see the HUD'],
              ['back', 'Back — sharper'],
            ]}
            value={settings.camera}
            onChange={setCamera}
          />
        </Panel>

        {__DEV__ ? (
          <Panel>
            <Label>Pose source (debug build only)</Label>
            <Segment<PoseSourceKind>
              options={[
                ['live', LivePoseSource.available() ? 'Camera' : 'Camera (unavailable)'],
                ['sim', 'Simulated athlete'],
                ['fixture', 'Fixture: pull-up clip B'],
              ]}
              value={sourceKind}
              onChange={(kind) => appContext.poseSourceKind.set(kind)}
            />
          </Panel>
        ) : null}

        <Panel>
          <Label>Privacy</Label>
          <Body tone="secondary">
            The camera runs on the phone and only on the phone. Frames are read for body keypoints
            and discarded; nothing is recorded, stored, or uploaded. What is kept: your sessions,
            reps, and lit days, in a database on this device. There is no account.
          </Body>
          <Button label="Erase all data" kind="danger" compact onPress={erase} />
        </Panel>

        <View style={styles.about}>
          <Title>Suit Up</Title>
          <Label>{`Version ${nativeApplicationVersion ?? '—'} (${nativeBuildVersion ?? '—'})`}</Label>
          <Body tone="secondary" style={styles.small}>
            Cindy is a benchmark workout in the public domain of gym culture: 5 pull-ups, 10
            push-ups, 15 squats, twenty minutes. Suit Up is not affiliated with any gym brand, film,
            or person.
          </Body>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Segment<V extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<readonly [V, string]>;
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map(([key, label]) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={[styles.segmentItem, selected && styles.segmentSelected]}
          >
            <Body
              strong={selected}
              tone={selected ? 'primary' : 'secondary'}
              style={styles.segmentLabel}
            >
              {label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: sp(5), gap: sp(4) },
  between: { justifyContent: 'space-between' },
  targetRow: { gap: sp(4) },
  segment: {
    flexDirection: 'row',
    gap: sp(1),
    backgroundColor: color.background,
    borderRadius: radius.medium,
    padding: sp(0),
  },
  segmentItem: {
    flex: 1,
    paddingVertical: sp(2),
    paddingHorizontal: sp(2),
    borderRadius: radius.small,
    alignItems: 'center',
  },
  segmentSelected: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.accent },
  segmentLabel: {
    fontSize: type.scale.caption + 2,
    lineHeight: (type.scale.caption + 2) * 1.3,
    textAlign: 'center',
  },
  about: { gap: sp(1), paddingBottom: sp(6) },
  small: { fontSize: type.scale.caption + 1, lineHeight: (type.scale.caption + 1) * 1.5 },
});
