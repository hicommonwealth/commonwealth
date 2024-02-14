import Sinon from 'sinon';
import {
  communityStakeConfigValidator,
  contractHelpers,
  newNamespaceValidator,
} from '../../../src/services/commonProtocol';

// mocks common protocol service (when testing the core domain)
const _validateNamespace = Sinon.stub(
  newNamespaceValidator,
  'validateNamespace',
).resolves();
const _validateCommunityStakeConfig = Sinon.stub(
  communityStakeConfigValidator,
  'validateCommunityStakeConfig',
).resolves();
Sinon.stub(contractHelpers, 'getNamespace').resolves('');
Sinon.stub(contractHelpers, 'getNamespaceBalance').resolves('0');

export { _validateCommunityStakeConfig, _validateNamespace };
