/* @jsx m */

import 'pages/discussions/index.scss';
import app from 'state';
import { Contract } from 'client/scripts/models';
import m from 'mithril';
import { FunctionInfo } from '../../components/abi_ui_generation/function_info';
import {
  parseFunctionsFromABI,
  getEtherscanABI,
} from '../../../helpers/abi_utils';
import { AbiFunction } from '../../../helpers/types';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';

class GeneralContractPage
  implements m.ClassComponent<{ contractAddress?: string }>
{
  view(vnode) {
    const loadAbiFromEtherscan = async (address: string) => {
      try {
        const etherscanAbi = await getEtherscanABI('mainnet', address);
        const abiString = JSON.stringify(etherscanAbi);
        return parseFunctionsFromABI(abiString);
      } catch (error) {
        console.log(error);
      }
    };

    const loadContractAbi = (address: string) => {
      const contract: Contract =
        app.contracts.store.getContractByAddress(address);
      const abiFunctions = parseFunctionsFromABI(contract.abi);
      if (abiFunctions) {
        return abiFunctions;
      } else {
        loadAbiFromEtherscan(address);
      }
      console.log(contract);
    };

    const { contractAddress } = vnode.attrs;

    loadContractAbi(contractAddress);

    if (!app.contracts) {
      return <PageLoading title="General Contract" />;
    }

    return (
      <Sublayout>
        <div class="General Contract Page">
          <div class="container">
            <h1>General Contract</h1>
            <h2>Contract Address: {contractAddress}</h2>
            <h2>
              Abi Functions:{' '}
              {loadContractAbi(contractAddress).map((fn: AbiFunction) => (
                <div class="function-container">
                  <div class="fn-name">{fn.name}</div>
                </div>
              ))}
            </h2>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default GeneralContractPage;
