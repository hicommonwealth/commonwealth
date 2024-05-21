export * as newNamespaceValidator from './newNamespaceValidator';

// TODO: resolve this (libs/protocol?) - poor typing experience
import * as stake from './communityStakeConfigValidator';
import * as contest from './contestHelper';
import * as contract from './contractHelpers';

// export modules as objects so they can be stubbed in tests
export const communityStakeConfigValidator = { ...stake };
export const contractHelpers: any = { ...contract };
export const contestHelper: any = { ...contest };
