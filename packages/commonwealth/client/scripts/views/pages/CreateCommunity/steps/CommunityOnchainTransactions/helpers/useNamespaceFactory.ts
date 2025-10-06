import { factoryContracts } from '@hicommonwealth/evm-protocols';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import { useFetchNodesQuery } from 'state/api/nodes';

const useNamespaceFactory = (ethChainId: number) => {
  const chainFactoryAddress = factoryContracts[ethChainId]?.NamespaceFactory;

  const { data: nodes } = useFetchNodesQuery();

  const chainRpc = nodes?.find((node) => node.ethChainId === ethChainId)?.url;

  // @ts-expect-error StrictNullChecks
  const namespaceFactory = new NamespaceFactory(chainFactoryAddress, chainRpc);

  return { namespaceFactory };
};

export default useNamespaceFactory;
