import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'models';
import { parseEventFromABI } from './abi_utils';

export function decodeCuratedFactoryTx(
  web3: Web3,
  fn: AbiItem,
  tx: any,
  contract: Contract
): string | null {
  if (
    contract.nickname === 'curated-factory-goerli' &&
    fn.name === 'createProject'
  ) {
    const eventAbiItem = parseEventFromABI(this.contract.abi, 'ProjectCreated');
    const decodedLog = web3.eth.abi.decodeLog(
      eventAbiItem.inputs,
      tx.logs[0].data,
      tx.logs[0].topics
    );
    return decodedLog.projectAddress;
  }
  return null;
}
