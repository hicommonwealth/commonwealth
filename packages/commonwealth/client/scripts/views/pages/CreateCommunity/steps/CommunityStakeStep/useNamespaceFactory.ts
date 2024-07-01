import { commonProtocol } from '@hicommonwealth/shared';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import app from 'state';

const useNamespaceFactory = (ethChainId: number) => {
  const chainFactoryAddress =
    commonProtocol.factoryContracts[ethChainId]?.factory;
  const chainRpc = app.config.nodes
    .getAll()
    .find((node) => node.ethChainId === ethChainId)?.url;
  // @ts-expect-error StrictNullChecks
  const namespaceFactory = new NamespaceFactory(chainFactoryAddress, chainRpc);

  return { namespaceFactory };
};

export default useNamespaceFactory;
