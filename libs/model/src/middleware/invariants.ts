import { InvalidState } from '@hicommonwealth/core';

export const MustExist = <T>(subject: string, state?: T | null): state is T => {
  if (!state) throw new InvalidState(`${subject} must exist`, state);
  return true;
};

export const MustNotExist = <T>(subject: string, state?: T | null) => {
  if (state) throw new InvalidState(`${subject} must not exist`, state);
};
