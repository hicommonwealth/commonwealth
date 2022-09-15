/* @jsx m */

import 'pages/discussions/index.scss';
import app from 'state';
import { Contract } from 'client/scripts/models';
import { debounce } from 'lodash';
import m from 'mithril';
import { parseFunctionsFromABI, getEtherscanABI, parseEventsFromABI } from '../../../helpers/abi_utils'
import { Network, AbiFunction, AbiEvent } from '../../../helpers/types';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';

// Graham 4/18/22 Todo: Consider re-implementing LastVisited logic
class GeneralContractPage implements m.ClassComponent<{ contract_address?: string }> {
  private hasContract: boolean;
  private contract: Contract;
  private abi_functions: Array<AbiFunction>;
  private abi_events: Array<AbiEvent>;
  private status= undefined;
  private message = '';
  private loaded = false;
  private loading = false;
  private saving = false;

  // Helpers
  getLastSeenDivider(hasText = true) {
    return (
      <div class="LastSeenDivider">
        {hasText ? (
          <>
            <hr />
            <span>Last visit</span>
            <hr />
          </>
        ) : (
          <hr />
        )}
      </div>
    );
  }

  async oninit(vnode) {
    const { contract_address } = vnode.attrs;
    const _contract: Contract = app.contracts.store.getContractByAddress(contract_address);
    this.contract = _contract;
    console.log(_contract)

    console.log("generateui")
    if (this.contract) {
        this.abi_functions = parseFunctionsFromABI(this.contract.abi);
        this.abi_events = parseEventsFromABI(this.contract.abi);
        console.log(this.abi_functions);
        console.log(this.abi_events);
    } else {
        const network = Network.Mainnet;
        console.log("Network: ", network)
        const etherscanAbi = await getEtherscanABI(network, contract_address);
        console.log("Etherscan Abi", etherscanAbi);
    }
}

  view(vnode) {
    const { contract_address } = vnode.attrs;

    return (
      <Sublayout>
        <div class="GeneralContractPage">
          <div class="container">
            <h1>General Contract</h1>
            <h2>Contract Address: {contract_address}</h2>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default GeneralContractPage;