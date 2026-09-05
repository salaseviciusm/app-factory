import type { NewId } from '@factory/core';
import { randomUUID } from 'expo-crypto';

export const expoCryptoIds: NewId = () => randomUUID();
