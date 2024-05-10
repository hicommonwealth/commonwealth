export * as newNamespaceValidator from './newNamespaceValidator';

import * as communityStakeConfigValidatorModule from './communityStakeConfigValidator';
import * as contractHelpersModule from './contractHelpers';

// export modules as objects so they can be stubbed in tests
export const contractHelpers: any = { ...contractHelpersModule };
export const communityStakeConfigValidator = {
  ...communityStakeConfigValidatorModule,
};

// esm stub fix
import * as contestHelpersModule from './contestHelper';
export const ContestHelper = { ...contestHelpersModule };
