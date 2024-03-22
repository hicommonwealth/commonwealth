import { EndpointOff, InvalidState } from '@hicommonwealth/core';
import { OpenFeature } from '@openfeature/server-sdk';

export const mustExist = <T>(subject: string, state?: T | null): state is T => {
  if (!state) throw new InvalidState(`${subject} must exist`, state);
  return true;
};

export const mustNotExist = <T>(subject: string, state?: T | null) => {
  if (state) throw new InvalidState(`${subject} must not exist`, state);
};

export const behindFeatureFlag = async (flag: string) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const client = OpenFeature.getClient();
  if (!(await client.getBooleanValue(flag, false))) {
    throw new EndpointOff('This endpoint has been disabled', flag);
  }
};
