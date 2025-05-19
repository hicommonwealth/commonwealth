import { PollView } from '@hicommonwealth/schemas';
import { DEFAULT_POLL_DURATION } from '@hicommonwealth/shared';
import { z } from 'zod';

export interface ExtendedPoll extends z.infer<typeof PollView> {
  custom_duration?: string;
}

export interface LocalPoll {
  options: Array<string>;
  prompt: string;
  community_id?: string;
  custom_duration?: string;
  ends_at: Date | undefined;
  votes: [];
}

export type SetLocalPolls = (params: LocalPoll[]) => void;

export function parseCustomDuration(customDuration?: string): number | null {
  console.log('Custom Duration Parsing:', customDuration);
  if (customDuration) {
    if (customDuration === 'Infinite') return null;
    return parseInt(customDuration, 10);
  }

  return DEFAULT_POLL_DURATION;
}
