import { InvalidState, logger } from '@hicommonwealth/core';

const log = logger(import.meta);

export const mustExist = <T>(subject: string, state?: T | null): state is T => {
  if (!state) throw new InvalidState(`${subject} must exist`, state);
  return true;
};

export const mustNotExist = <T>(subject: string, state?: T | null) => {
  if (state) throw new InvalidState(`${subject} must not exist`, state);
};

export const shouldExist = <T>(subject: string, state?: T | null) => {
  if (!state) {
    const err = new InvalidState(`${subject} should exist`, state);
    log.error(err.message, err);
    return false;
  }
  return true;
};
