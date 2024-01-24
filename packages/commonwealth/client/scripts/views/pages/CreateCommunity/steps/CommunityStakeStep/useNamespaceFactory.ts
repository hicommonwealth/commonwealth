import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';

const useNamespaceFactory = () => {
  const goerliFactoryAddress = factoryContracts[ValidChains.Goerli].factory;
  const namespaceFactory = new NamespaceFactory(goerliFactoryAddress);
  namespaceFactory.initialize().catch(console.log);

  return { namespaceFactory };
};

export default useNamespaceFactory;
