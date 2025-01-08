export * as newNamespaceValidator from './newNamespaceValidator';

import * as wallet from './aaWallet';
import * as stake from './communityStakeConfigValidator';
import * as contest from './contestHelper';
import * as contract from './contractHelpers';

export const communityStakeConfigValidator = { ...stake };
export const contractHelpers = { ...contract };
export const contestHelper = { ...contest };
export const aaWallet = { ...wallet };
