import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import { ValidChains, factoryContracts } from 'helpers/chainConfig';

const useNamespaceFactory = () => {
  const goerliFactoryAddress = factoryContracts[ValidChains.Goerli].factory;
  const namespaceFactory = new NamespaceFactory(goerliFactoryAddress);
  namespaceFactory.initialize().catch(console.log);

  return { namespaceFactory };
};

export default useNamespaceFactory;
