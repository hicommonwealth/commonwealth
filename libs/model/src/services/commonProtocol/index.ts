export * as newNamespaceValidator from './newNamespaceValidator';

import * as stake from './communityStakeConfigValidator';
import * as contest from './contestHelper';
import * as contract from './contractHelpers';

// export modules as objects so they can be stubbed in tests
export const communityStakeConfigValidator = { ...stake };
export const contractHelpers = { ...contract };
export const contestHelper = { ...contest };
