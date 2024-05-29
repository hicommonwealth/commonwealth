import { commonProtocol } from '@hicommonwealth/shared';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import app from 'state';

const useNamespaceFactory = (ethChainId: number) => {
  const goerliFactoryAddress =
    commonProtocol.factoryContracts[ethChainId].factory;
  const chainRpc = app.config.nodes
    .getAll()
    .find((node) => node.ethChainId === ethChainId)?.url;
  const namespaceFactory = new NamespaceFactory(goerliFactoryAddress, chainRpc);

  return { namespaceFactory };
};

export default useNamespaceFactory;
