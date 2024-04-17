export * as communityStakeConfigValidator from './communityStakeConfigValidator';
export * as newNamespaceValidator from './newNamespaceValidator';
import * as contractHelpersModule from './contractHelpers';

// Export contractHelpers as an object and not an ES Module,
// so it can be stubbed in tests
const contractHelpers = { ...contractHelpersModule };

export {
  communityStakeConfigValidator,
  contractHelpers,
  newNamespaceValidator,
};
