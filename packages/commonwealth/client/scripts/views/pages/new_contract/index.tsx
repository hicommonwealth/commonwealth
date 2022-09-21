/* @jsx m */

import 'pages/new_contract_page.scss';
import app from 'state';
import m from 'mithril';
import $ from 'jquery';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { BigNumber, ethers } from 'ethers';
import { AbiItem, AbiInput, AbiOutput } from 'web3-utils/types';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { ChainBase } from 'common-common/src/types';
import { AddContractForm } from './add_contract_form';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';

class NewContractPage implements m.ClassComponent<any> {
  private state = {
    ethChainNames: {},
    ethChains: {},
    loadingEthChains: true,
  };

  oninit() {
    // query eth chains
    $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(async (res) => {
      if (res.status === 'Success') {
        this.state.ethChains = res.result;
      }

      // query names from chainlist if possible
      const chains = await $.getJSON('https://chainid.network/chains.json');
      for (const id of Object.keys(this.state.ethChains)) {
        const chain = chains.find((c) => c.chainId === +id);
        if (chain) {
          this.state.ethChainNames[id] = chain.name;
        }
      }
      this.state.loadingEthChains = false;
      m.redraw();
    });
  }

  view(vnode) {
    const getActiveForm = () => {
      const { ethChains, ethChainNames } = this.state;
      return (
          <AddContractForm
            ethChains={ethChains}
            ethChainNames={ethChainNames}
          />
      );
    };

    // Payable functions are not supported in this implementation

    if (!app.contracts || !app.chain) {
      return <PageLoading title="General Contract" />;
    } else {
      if (app.chain.base !== ChainBase.Ethereum) {
        return (
          <PageNotFound content="Contract ABI UI Generator Only Available for Ethereum based Chains" />
        );
      }
    }

    return (
      <Sublayout>
        <div class="NewContractPage">
          <CWText type="h4">Add New Contract</CWText>
          {!this.state.loadingEthChains && getActiveForm()}
        </div>
      </Sublayout>
    );
  }
}

export default NewContractPage;
