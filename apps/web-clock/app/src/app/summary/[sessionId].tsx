import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { appContext } from '../../context/app-context';
import { Body, Button, Label, Screen, sp, Title } from '../../design';
import { activeChallenge } from '../../domain/projections/challenge-calendar';
import { sessionById } from '../../domain/projections/sessions';
import { foldSettings } from '../../domain/projections/settings';
import { cardShared } from '../../domain/workout/events';
import { useEvents } from '../../lib/use-events';
import { DayCard } from '../../ui/day-card';

/** Screenshots 5 and 6: the day card, and the same card into the share sheet. */
export default function Summary() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const events = useEvents();
  const session = sessionId ? sessionById(events, sessionId) : undefined;
  const challenge = activeChallenge(events);
  const settings = foldSettings(events);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!session) {
    return (
      <Screen>
        <View style={styles.center}>
          <Body tone="secondary">No session here.</Body>
          <Button label="Home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const inChallenge = challenge && session.challengeId === challenge.challengeId;
  const litThisSession = inChallenge && [...challenge.daysLit.values()].includes(session.sessionId);

  const share = async () => {
    if (!cardRef.current) {
      return;
    }
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Post the card' });
        appContext.bus.publish(
          cardShared.create(appContext, {
            sessionId: session.sessionId,
            challengeId: session.challengeId,
            kind: 'day',
          }),
        );
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Label tone="accent">
          {litThisSession ? 'Day counted' : session.early ? 'Stopped early' : 'Finished'}
        </Label>
        <Title>{headline(session.rounds, session.early, litThisSession === true)}</Title>
        <DayCard
          ref={cardRef}
          session={session}
          firstRounds={inChallenge ? challenge.firstRounds : undefined}
          daysLit={inChallenge ? challenge.daysLit.size : undefined}
          targetRounds={session.targetRounds ?? settings.targetRounds}
        />
        {session.framingLostMs > 30_000 ? (
          <Body tone="secondary">
            {`The camera lost you for ${Math.round(session.framingLostMs / 1000)} s. Prop the phone further back next time and reps will count more often.`}
          </Body>
        ) : null}
        <Button
          label={sharing ? 'Preparing…' : 'Share the card'}
          onPress={() => void share()}
          disabled={sharing}
        />
        <Button label="Done" kind="secondary" onPress={() => router.replace('/')} />
      </ScrollView>
    </Screen>
  );
}

function headline(rounds: number, early: boolean, lit: boolean): string {
  if (early) {
    return 'Stopped early. Nothing lit today.';
  }
  if (lit) {
    return rounds === 0 ? 'Twenty minutes, counted.' : `${rounds} rounds. Counted.`;
  }
  return rounds === 0 ? 'Twenty minutes done.' : `${rounds} rounds.`;
}

const styles = StyleSheet.create({
  scroll: { padding: sp(5), gap: sp(4) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: sp(3) },
});
