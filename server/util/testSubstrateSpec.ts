import { ApiPromise, WsProvider } from '@polkadot/api';
import { RegisteredTypes } from '@polkadot/types/types';

import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const testSubstrateSpec = async (specString: string, nodeUrl: string) => {
  // test out spec
  // get spec from request
  let unpackedSpec: RegisteredTypes;
  try {
    unpackedSpec = JSON.parse(specString);
  } catch (e) {
    throw new Error('Could not parse spec data');
  }
  const sanitizedSpec: RegisteredTypes = {
    types: unpackedSpec['types'],
    typesAlias: unpackedSpec['typesAlias'],
    typesBundle: unpackedSpec['typesBundle'],
    typesChain: unpackedSpec['typesChain'],
    typesSpec: unpackedSpec['typesSpec'],
  };

  const provider = new WsProvider(constructSubstrateUrl(nodeUrl), false);
  try {
    await provider.connect();
  } catch (err) {
    throw new Error('failed to connect to node url');
  }
  try {
    const api = await ApiPromise.create({ provider, ...sanitizedSpec });
    const version = api.runtimeVersion;
    const props = await api.rpc.system.properties();
    log.info(`Fetched version: ${version.specName}:${version.specVersion} and properties ${JSON.stringify(props)}`);
    return sanitizedSpec;
  } catch (err) {
    throw new Error(`failed to initialize polkadot api: ${err.message}`);
  }
};

export default testSubstrateSpec;
