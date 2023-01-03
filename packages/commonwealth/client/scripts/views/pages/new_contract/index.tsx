/* @jsx m */

import 'pages/new_contract_page.scss';
import app from 'state';
import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import { CWText } from 'views/components/component_kit/cw_text';
import { ChainBase } from 'common-common/src/types';
import { AddContractForm } from './add_contract_form';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

class NewContractPage extends ClassComponent {
  private ethChainNames = {};
  private ethChains = {};
  private loadingEthChains = true;

  oninit() {
    // query eth chains
    $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(async (res) => {
      if (res.status === 'Success') {
        this.ethChains = res.result;
      }

      // query names from chainlist if possible
      const chains = await $.getJSON('https://chainid.network/chains.json');
      for (const id of Object.keys(this.ethChains)) {
        const chain = chains.find((c) => c.chainId === +id);
        if (chain) {
          this.ethChainNames[id] = chain.name;
        }
      }
      this.loadingEthChains = false;
      m.redraw();
    });
  }

  view() {
    const getActiveForm = () => {
      const { ethChains, ethChainNames } = this;
      return (
        <AddContractForm ethChains={ethChains} ethChainNames={ethChainNames} />
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
          {!this.loadingEthChains ? getActiveForm() : <CWSpinner />}
        </div>
      </Sublayout>
    );
  }
}

export default NewContractPage;
