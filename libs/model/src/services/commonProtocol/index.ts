export * as newNamespaceValidator from './newNamespaceValidator';

import * as wallet from './aaWallet';
import * as stake from './communityStakeConfigValidator';
import * as contract from './contractHelpers';

export const communityStakeConfigValidator = { ...stake };
export const contractHelpers = { ...contract };
export const aaWallet = { ...wallet };
