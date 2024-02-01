import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import app from 'state';

const useNamespaceFactory = () => {
  const goerliFactoryAddress = factoryContracts[ValidChains.Sepolia].factory;
  const chainRpc = app.config.nodes
    .getAll()
    .find((node) => node.ethChainId === ValidChains.Sepolia)?.url;
  const namespaceFactory = new NamespaceFactory(goerliFactoryAddress, chainRpc);

  return { namespaceFactory };
};

export default useNamespaceFactory;
