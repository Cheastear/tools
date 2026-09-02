import { randomBytes } from 'crypto';

export const secureToken = (bytes: number = 24): string => {
  return randomBytes(bytes).toString('hex');
};
