import { commonProtocol } from '@hicommonwealth/core';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import app from 'state';

const useNamespaceFactory = () => {
  const goerliFactoryAddress =
    commonProtocol.factoryContracts[commonProtocol.ValidChains.Goerli].factory;
  const chainRpc = app.config.nodes
    .getAll()
    .find((node) => node.ethChainId === commonProtocol.ValidChains.Goerli)?.url;
  const namespaceFactory = new NamespaceFactory(goerliFactoryAddress, chainRpc);

  return { namespaceFactory };
};

export default useNamespaceFactory;
