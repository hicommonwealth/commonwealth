export * as communityStakeConfigValidator from './communityStakeConfigValidator';
export * as ContestHelper from './contestHelper';
export * as contractHelpers from './contractHelpers';
export * as newNamespaceValidator from './newNamespaceValidator';

import * as communityStakeConfigValidatorModule from './communityStakeConfigValidator';
import * as contractHelpersModule from './contractHelpers';

// export modules as objects so they can be stubbed in tests
export const contractHelpers = { ...contractHelpersModule };
export const communityStakeConfigValidator = {
  ...communityStakeConfigValidatorModule,
};
