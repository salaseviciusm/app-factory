import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { useFonts } from 'expo-font';

/** Syne 800 for display and every number; Inter for reading; Plex Mono for labels. */
export const font = {
  display: 'Syne_800ExtraBold',
  body: 'Inter_400Regular',
  bodyStrong: 'Inter_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
} as const;

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Syne_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    IBMPlexMono_500Medium,
  });
  return loaded || error !== null;
}
