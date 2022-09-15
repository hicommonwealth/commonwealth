/* @jsx m */

import 'pages/discussions/index.scss';
import app from 'state';
import { Contract } from 'client/scripts/models';
import { debounce } from 'lodash';
import m from 'mithril';
import { parseFunctionsFromABI, getEtherscanABI, parseEventsFromABI } from '../../../helpers/abi_utils'
import { Network } from '../../../helpers/types';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';

// Graham 4/18/22 Todo: Consider re-implementing LastVisited logic
class GeneralContractPage implements m.ClassComponent<{ contract_address?: string }> {
  private hasContract: boolean;
  private contract: Contract;
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

  oninit(vnode) {
    const { contract_address } = vnode.attrs;
    const _contract: Contract = app.contracts.store.getContractByAddress(contract_address);
    this.contract = _contract;
    console.log(_contract)
  }

  view(vnode) {
    const { contract_address } = vnode.attrs;

    const generateUI = async () => {
        try {
          console.log("generateui")
          if (this.contract) {
            console.log(await parseFunctionsFromABI(this.contract.abi));
            console.log(await parseEventsFromABI(this.contract.abi));
          } else {
            const network = Network.Mainnet;
            console.log("Network: ", network)
            const etherscanAbi = await getEtherscanABI(network, contract_address);
            console.log("Etherscan Abi", etherscanAbi);
          }
        } catch (e) {
          this.status = 'failure';
          this.message = e.message;
          this.loading = false;
          m.redraw();
        }
    };

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