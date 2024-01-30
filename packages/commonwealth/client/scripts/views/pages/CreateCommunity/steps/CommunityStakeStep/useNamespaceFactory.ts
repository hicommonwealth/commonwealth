import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';

const useNamespaceFactory = () => {
  const goerliFactoryAddress = factoryContracts[ValidChains.Goerli].factory;
  const namespaceFactory = new NamespaceFactory(goerliFactoryAddress);

  return { namespaceFactory };
};

export default useNamespaceFactory;
