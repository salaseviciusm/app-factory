import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, color, Label, Numeral, radius, Row, sp, type } from '../design';
import type { VariantPlan } from '../domain/detectors/detector';
import { formatScore } from '../domain/workout/cindy';
import type { SessionSummary } from '../domain/projections/sessions';
import { SkeletonFigure } from './skeleton-figure';

export interface DayCardProps {
  session: SessionSummary;
  /** Day-1 rounds for the challenge, when this session is part of one. */
  firstRounds: number | undefined;
  daysLit: number | undefined;
  targetRounds: number | undefined;
}

/**
 * The card. Same component on the summary screen and in the share sheet: what the
 * athlete posts is what they saw. Keypoints only — never the camera.
 */
export const DayCard = forwardRef<View, DayCardProps>(function DayCard(
  { session, firstRounds, daysLit, targetRounds },
  ref,
) {
  const score = formatScore(session.rounds, session.leftoverReps);
  const delta =
    firstRounds !== undefined && session.dayIndex !== undefined && session.dayIndex > 1
      ? session.rounds - firstRounds
      : undefined;
  const targetPct = targetRounds ? Math.min(1, session.rounds / targetRounds) : undefined;

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <Row style={styles.header}>
        <Label tone="accent">
          {session.dayIndex ? `Day ${session.dayIndex}` : 'Cindy · 20:00'}
        </Label>
        <Label>{session.early ? 'stopped early' : 'counted'}</Label>
      </Row>
      <Row style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Numeral size={type.scale.counter}>{score}</Numeral>
          <Label>rounds</Label>
        </View>
        {session.pose ? <SkeletonFigure joints={session.pose.joints} size={112} /> : null}
      </Row>
      {firstRounds !== undefined && delta !== undefined ? (
        <Row style={styles.compare}>
          <View>
            <Numeral size={type.scale.display} tone="secondary">
              {firstRounds}
            </Numeral>
            <Label>day 1</Label>
          </View>
          <Body tone="secondary" style={styles.arrow}>
            →
          </Body>
          <View>
            <Numeral size={type.scale.display}>{session.rounds}</Numeral>
            <Label>today</Label>
          </View>
          <View style={styles.delta}>
            <Numeral size={type.scale.display} tone="accent">
              {delta >= 0 ? `+${delta}` : `${delta}`}
            </Numeral>
            <Label>rounds</Label>
          </View>
        </Row>
      ) : null}
      {targetPct !== undefined ? (
        <View style={styles.targetWrap}>
          <View style={styles.targetTrack}>
            <View style={[styles.targetFill, { width: `${Math.round(targetPct * 100)}%` }]} />
          </View>
          <Row style={styles.between}>
            <Label>target</Label>
            <Label tone="primary">{targetRounds}</Label>
          </Row>
        </View>
      ) : null}
      <Row style={styles.footer}>
        <Label>{planLabel(session.plan)}</Label>
        {daysLit !== undefined ? <Label>{`${daysLit} counted`}</Label> : null}
      </Row>
      <Row style={styles.footer}>
        <Label tone="secondary">{`${session.repsCounted} counted · ${session.repsManual} added · ${session.repsRejected} not counted`}</Label>
      </Row>
    </View>
  );
});

export function planLabel(plan: VariantPlan): string {
  const parts = [
    plan.pullup === 'rx' ? 'pull-ups' : 'jumping pull-ups',
    plan.pushup === 'rx' ? 'push-ups' : 'knee push-ups',
    plan.squat === 'rx' ? 'air squats' : 'box squats',
  ];
  const rx = plan.pullup === 'rx' && plan.pushup === 'rx' && plan.squat === 'rx';
  return rx ? 'Rx' : parts.join(' · ');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.large,
    padding: sp(4),
    gap: sp(3),
  },
  header: { justifyContent: 'space-between' },
  scoreRow: { justifyContent: 'space-between', alignItems: 'flex-end' },
  scoreBlock: { gap: sp(0) },
  compare: { gap: sp(3), alignItems: 'flex-end' },
  arrow: { fontSize: type.scale.title, paddingBottom: sp(3) },
  delta: { marginLeft: 'auto' },
  targetWrap: { gap: sp(1) },
  targetTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: color.background,
    overflow: 'hidden',
  },
  targetFill: { height: 6, backgroundColor: color.accent },
  between: { justifyContent: 'space-between' },
  footer: { justifyContent: 'space-between', flexWrap: 'wrap' },
});
