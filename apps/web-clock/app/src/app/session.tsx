import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppleVisionPose,
  PosePreview,
  type CameraPermission,
} from '../../modules/apple-vision-pose';
import { appContext } from '../context/app-context';
import { Body, Button, color, Label, Numeral, Panel, Row, sp, Title, type } from '../design';
import { REJECT_COPY, type Move } from '../domain/detectors/detector';
import type { FramingState } from '../domain/detectors/framing-gate';
import { activeChallenge } from '../domain/projections/challenge-calendar';
import { foldSettings } from '../domain/projections/settings';
import { formatClock } from '../domain/workout/amrap-clock';
import { MOVE_LABEL } from '../domain/workout/cindy';
import type { LiveState } from '../domain/workout/director';
import { cameraChanged } from '../domain/workout/events';
import { useCell } from '../lib/use-cell';
import { PoseOverlay } from '../ui/pose-overlay';

const REJECT_VISIBLE_MS = 2500;

export default function Session() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string; dayIndex?: string; mode?: string }>();
  const { director } = appContext;
  const live = useCell(director.live);
  const pose = useCell(director.pose);
  const cameraError = useCell(appContext.cameraError);
  const sourceKind = useCell(appContext.poseSourceKind);
  const [permission, setPermission] = useState<CameraPermission | 'not-needed'>('undetermined');
  const [now, setNow] = useState(() => appContext.clock());
  useKeepAwake();

  useEffect(() => {
    const events = appContext.events();
    const settings = foldSettings(events);
    const challenge = params.challengeId ? activeChallenge(events) : undefined;
    director.prepare({
      sessionId: appContext.newId(),
      challengeId: params.challengeId,
      dayIndex: params.dayIndex ? Number(params.dayIndex) : undefined,
      plan: challenge?.plan ?? settings.plan,
      targetRounds: settings.targetRounds,
    });
    appContext.cameraError.set(undefined);

    const source = appContext.createPoseSource();
    const unsubscribe = source.subscribe((frame) => director.onFrame(frame));
    let cancelled = false;
    (async () => {
      if (source.kind === 'live' && AppleVisionPose) {
        const status = await AppleVisionPose.requestPermission();
        if (cancelled) {
          return;
        }
        setPermission(status);
        if (status !== 'granted') {
          return;
        }
      } else {
        setPermission('not-needed');
      }
      await source.start();
    })().catch((error: unknown) => appContext.cameraError.set(String(error)));

    const ticker = setInterval(() => {
      director.tick();
      setNow(appContext.clock());
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(ticker);
      unsubscribe();
      source.stop();
      const phase = director.live.get().phase;
      if (phase === 'running' || phase === 'paused' || phase === 'framing' || phase === 'ready') {
        director.abandon();
      }
    };
    // Params are read once: a session is one screen visit.
  }, []);

  useEffect(() => {
    if (live.phase === 'finished' && live.sessionId) {
      router.replace({ pathname: '/summary/[sessionId]', params: { sessionId: live.sessionId } });
    }
  }, [live.phase, live.sessionId, router]);

  const lastCount = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (live.lastCountAtMs !== undefined && live.lastCountAtMs !== lastCount.current) {
      lastCount.current = live.lastCountAtMs;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [live.lastCountAtMs]);
  const lastReject = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (live.lastReject && live.lastReject.atMs !== lastReject.current) {
      lastReject.current = live.lastReject.atMs;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [live.lastReject]);

  const rejectVisible =
    live.lastReject !== undefined && now - live.lastReject.atMs < REJECT_VISIBLE_MS;
  const overlayTone = rejectVisible ? 'reject' : live.framing === 'ok' ? 'ok' : 'neutral';

  return (
    <View style={styles.root}>
      {sourceKind === 'live' && PosePreview ? (
        <PosePreview style={styles.fill} />
      ) : (
        <View style={[styles.fill, styles.dark]} />
      )}
      <PoseOverlay frame={pose} tone={overlayTone} />
      <View style={styles.scrim} pointerEvents="none" />

      <SafeAreaView style={styles.hud}>
        <Row style={styles.top}>
          <Numeral size={64} tone={live.phase === 'paused' ? 'secondary' : 'primary'}>
            {formatClock(live.remainingMs)}
          </Numeral>
          <View style={styles.topRight}>
            {params.dayIndex ? (
              <Label tone="accent">{`Day ${params.dayIndex}`}</Label>
            ) : (
              <Label tone="accent">Cindy</Label>
            )}
            <Label tone="primary">{`Round ${live.round}`}</Label>
            {sourceKind !== 'live' ? <Label>{sourceKind}</Label> : null}
          </View>
        </Row>

        <View style={styles.middle}>
          {permission === 'denied' ? (
            <PermissionDenied />
          ) : cameraError ? (
            <Panel>
              <Label tone="danger">camera</Label>
              <Body>{cameraError}</Body>
              <Button label="Back" kind="secondary" onPress={() => router.back()} />
            </Panel>
          ) : live.phase === 'framing' || live.phase === 'ready' ? (
            <Gate live={live} onStart={() => director.start()} onCancel={() => router.back()} />
          ) : live.phase === 'paused' ? (
            <Panel>
              <Label>paused</Label>
              <Title>{`${live.rounds} rounds · ${live.leftoverReps} reps so far`}</Title>
              <Button label="Resume" onPress={() => director.resume()} />
              <Button label="Finish now" kind="danger" onPress={() => director.finish(true)} />
            </Panel>
          ) : rejectVisible && live.lastReject ? (
            <View style={styles.reject}>
              <Label tone="danger">not counted</Label>
              <Title style={styles.rejectTitle}>{REJECT_COPY[live.lastReject.reason]}</Title>
              <Button
                label="+1 · it was clean"
                kind="secondary"
                compact
                onPress={() => director.addManualRep()}
              />
            </View>
          ) : live.framing !== 'ok' ? (
            <View style={styles.reject}>
              <Label tone="danger">{framingCopy(live.framing, live.move)}</Label>
            </View>
          ) : null}
        </View>

        {live.phase === 'running' || live.phase === 'paused' ? (
          <View style={styles.bottom}>
            <Label tone="primary">{moveLabel(live)}</Label>
            <Numeral size={type.scale.counter} tone={live.repsInSet > 0 ? 'accent' : 'primary'}>
              {`${live.repsInSet}`}
              <Numeral size={type.scale.display} tone="secondary">{`/${live.repsTarget}`}</Numeral>
            </Numeral>
            <Row style={styles.controls}>
              <Button
                label="+1"
                kind="secondary"
                compact
                onPress={() => director.addManualRep()}
                accessibilityLabel="Add one rep manually"
                style={styles.control}
              />
              {live.phase === 'running' ? (
                <Button
                  label="Pause"
                  kind="secondary"
                  compact
                  onPress={() => director.pause()}
                  style={styles.control}
                />
              ) : (
                <Button
                  label="Resume"
                  kind="secondary"
                  compact
                  onPress={() => director.resume()}
                  style={styles.control}
                />
              )}
              <Button
                label="Finish"
                kind="danger"
                compact
                onPress={() => director.finish(true)}
                style={styles.control}
              />
            </Row>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function Gate({
  live,
  onStart,
  onCancel,
}: {
  live: LiveState;
  onStart: () => void;
  onCancel: () => void;
}) {
  const settings = foldSettings(appContext.events());
  const flip = () => {
    const facing = settings.camera === 'front' ? 'back' : 'front';
    appContext.bus.publish(cameraChanged.create(appContext, { facing }));
    if (AppleVisionPose && appContext.poseSourceKind.get() === 'live') {
      void AppleVisionPose.start({ facing, fps: 30 });
    }
  };
  const ready = live.phase === 'ready';
  return (
    <Panel style={ready ? styles.gateReady : undefined}>
      <Label tone={ready ? 'accent' : 'secondary'}>{ready ? 'we can see you' : 'framing'}</Label>
      <Title>{ready ? 'Ready when you are.' : 'Prop the phone. Step back.'}</Title>
      <Body tone="secondary">
        {ready
          ? `First up: ${live.repsTarget} ${MOVE_LABEL[live.move].toLowerCase()}. Twenty minutes starts on your tap.`
          : framingCopy(live.framing, live.move)}
      </Body>
      <Button label="Start 20:00" onPress={onStart} disabled={!ready} />
      <Row style={styles.gateLinks}>
        <Button label={`Camera: ${settings.camera}`} kind="ghost" compact onPress={flip} />
        <Button label="Cancel" kind="ghost" compact onPress={onCancel} />
      </Row>
    </Panel>
  );
}

function PermissionDenied() {
  const router = useRouter();
  return (
    <Panel>
      <Label tone="danger">camera</Label>
      <Title>The camera is the judge.</Title>
      <Body tone="secondary">
        Suit Up counts reps by watching you. Nothing is recorded or uploaded — frames are read and
        discarded on the phone. Allow camera access in Settings to continue.
      </Body>
      <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
      <Button label="Back" kind="ghost" onPress={() => router.back()} />
    </Panel>
  );
}

function moveLabel(live: LiveState): string {
  const base = MOVE_LABEL[live.move];
  switch (live.variant) {
    case 'jumping':
      return `Jumping ${base.toLowerCase()}`;
    case 'knee':
      return `Knee ${base.toLowerCase()}`;
    case 'box':
      return `Box ${base.toLowerCase()}`;
    default:
      return base;
  }
}

function framingCopy(state: FramingState, move: Move): string {
  switch (state) {
    case 'ok':
      return 'We can see you.';
    case 'no-body':
      return 'Step back until we can see you.';
    case 'too-close':
      return 'Too close. Step back a little.';
    case 'joints-missing':
      switch (move) {
        case 'pullup':
          return 'We need your shoulders, elbows and hands in frame — and the bar.';
        case 'pushup':
          return 'Side on. We need one whole arm, shoulder to hand.';
        case 'squat':
          return 'We need hips, knees and feet in frame. Step back.';
      }
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dark: { backgroundColor: color.background },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,16,19,0.28)',
  },
  hud: { flex: 1, padding: sp(4), justifyContent: 'space-between' },
  top: { justifyContent: 'space-between', alignItems: 'flex-start' },
  topRight: { alignItems: 'flex-end', gap: sp(0) },
  middle: { flex: 1, justifyContent: 'center', gap: sp(3) },
  gateReady: { borderWidth: 2, borderColor: color.accent },
  gateLinks: { justifyContent: 'space-between' },
  reject: { alignItems: 'center', gap: sp(2) },
  rejectTitle: { textAlign: 'center' },
  bottom: { gap: sp(2), alignItems: 'center' },
  controls: { gap: sp(2), alignSelf: 'stretch' },
  control: { flex: 1 },
});
