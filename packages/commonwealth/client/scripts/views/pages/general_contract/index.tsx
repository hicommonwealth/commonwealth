/* @jsx m */

import 'pages/discussions/index.scss';
import app from 'state';
import { Contract } from 'client/scripts/models';
import { debounce } from 'lodash';
import m from 'mithril';
import { chain } from 'web3-core/types';
import { PageNotFound } from 'views/pages/404';
import { FunctionInfo } from '../../components/abi_ui_generation/function_info';
import { parseFunctionsFromABI, getEtherscanABI, parseEventsFromABI } from '../../../helpers/abi_utils'
import { AbiFunction, AbiEvent } from '../../../helpers/types';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';

class GeneralContractPage implements m.ClassComponent<{ contract_address?: string }> {

  loadContractAbi = (address: string) => {
    const _contract: Contract = app.contracts.store.getContractByAddress(address);
    const abi_functions = parseFunctionsFromABI(_contract.abi);
    // this.abi_events = parseEventsFromABI(_contract.abi);
    console.log(abi_functions);
    // console.log(this.abi_events);
    console.log("generateui")
    // return abi_functions;
  }

  loadAbiFromEtherscan = async (address: string) => {
    const network: chain = "mainnet";
    console.log("Network: ", network)
    const etherscanAbi = await getEtherscanABI(network, address);
    console.log("Etherscan Abi", etherscanAbi);
    const abiString = JSON.stringify(etherscanAbi);
    const abi_functions = parseFunctionsFromABI(abiString);
    // this.abi_events = parseEventsFromABI(abiString);
    console.log(abi_functions);
    // console.log(this.abi_events);
  }

  // oninit(vnode) {
  //   const { contract_address } = vnode.attrs;

  //   const loadContractAbi = async () =>{
  //     const _contract: Contract = app.contracts.store.getContractByAddress(contract_address);
  //     this.contract = _contract;
  //     this.abi_functions = parseFunctionsFromABI(this.contract.abi);
  //     // this.abi_events = parseEventsFromABI(this.contract.abi);
  //     console.log(this.abi_functions);
  //     // console.log(this.abi_events);
  //     console.log("generateui")
  //     m.redraw();
  //   }

  //   if (this.contract) {
  //     console.log("got here")
  //   }
  //   if (this.abi_functions) {
  //     console.log("got here")
  //   }

  //   loadContractAbi();

  //   if (this.contract) {
  //     console.log("got here")
  //   }
  //   if (this.abi_functions) {
  //     console.log("got here")
  //   }
  // }

  view(vnode) {
      const { contract_address } = vnode.attrs;

      if (!app.contracts) {
        return m(PageLoading, {
          title: 'General Contract'
        });
      }

      return (
          <Sublayout>
            <div class="General Contract Page">
              <div class="container">
                <h1>General Contract</h1>
                <h2>Contract Address: {contract_address}</h2>
                <h2>Abi Functions: {this.loadContractAbi(contract_address)}</h2>
              </div>
              {/* <FunctionInfo fns={this.abi_functions}/> */}
            </div>
          </Sublayout>
      );
    // }
  }
}

export default GeneralContractPage;