/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/abi_factory_form.scss';

import app from 'state';
import {
  ChainNetwork,
  factoryNicknameToCreateFunctionName,
} from 'common-common/src/types';
import { AbiInput, AbiItem, AbiOutput, isAddress } from 'web3-utils';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { IdRow, InputRow } from 'views/components/metadata_rows';

import { CWButton } from 'views/components/component_kit/cw_button';
import {
  CWValidationText,
  ValidationStatus,
} from 'views/components/component_kit/cw_validation_text';

import {
  initChainForm,
  defaultChainRows,
  ethChainRows,
} from 'views/pages/create_community/chain_input_rows';

import {
  EthChainAttrs,
} from 'views/pages/create_community/types';

import { slugifyPreserveDashes } from 'utils';
import { Contract } from 'models';
import {
  handleMappingAbiInputs,
  validateAbiInput,
} from 'helpers/abi_form_helpers';
import { parseFunctionFromABI } from 'commonwealth/shared/abi_utils';
import ClassComponent from 'class_component';
import { createCuratedProjectDao } from '../../../helpers/dao_factory_helpers';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

export class AbiFactoryForm extends ClassComponent<EthChainAttrs> {
  private message = '';
  private loaded = false;
  private loading = false;
  private saving = false;
  private status = undefined;
  private ethChainNames = {};
  private ethChains = {};
  private loadingEthChains = true;
  private functionNameToFunctionOutput = new Map<string, any[]>();
  private functionNameToFunctionInputArgs = new Map<
    string,
    Map<number, string>
  >();
  private daoFactoryType = 'curated-factory-goerli';
  private form = {
    chainString: 'Ethereum Mainnet',
    ethChainId: 1,
    network: ChainNetwork.Ethereum,
    id: '',
    name: '',
    nodeUrl: '',
    symbol: '',
    tokenName: 'token',
    ...initChainForm(),
  };

  oninit(vnode: m.Vnode<EthChainAttrs>) {
    this.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode: m.Vnode<EthChainAttrs>) {
    const queryEthChains = async () => {
      // query eth chains
      $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(
        async (res) => {
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
        }
      );
    };

    const disableField = !this.loaded;

    const createDao = async (fn: AbiItem) => {
      const contract: Contract =
        app.contracts.getFactoryContractByNickname(this.daoFactoryType);
      if (!contract || !contract.address) {
        return;
      }
      const contractAddress = contract.address;

      this.loading = true;
      try {
        await createCuratedProjectDao(
          contractAddress,
          fn,
          this.functionNameToFunctionInputArgs,
          this.form
        );
      } catch (err) {
        notifyError(
          err.responseJSON?.error ||
            'Creating new ETH DAO Factory based community failed'
        );
        this.status = 'failure';
        this.message = err.message;
        this.loading = false;
        m.redraw();
        return;
      }
      this.loaded = true;
      this.loading = false;
      m.redraw();
    };

    const loadFactoryContractAbi = (nickname: string): AbiItem => {
      const contract: Contract =
        app.contracts.getFactoryContractByNickname(nickname);
      if (!contract || !contract.abi) {
        // TODO: show screen for "no ABI found" -- or fetch data
        return null;
      }
      const factoryFn = factoryNicknameToCreateFunctionName[nickname];
      if (!factoryFn) return null;
      const abiFunction = parseFunctionFromABI(contract.abi, factoryFn);
      return abiFunction;
    };

    const renderFactoryFunction = () => {
      const fn = loadFactoryContractAbi(this.daoFactoryType);
      return (
        <div class="function-row">
          <CWText>{fn.name}</CWText>
          <CWText>{fn.stateMutability}</CWText>
          <div class="functions-input-container">
            {fn.inputs.map((input: AbiInput, inputIdx: number) => {
              return (
                <div>
                  <div class="function-inputs">
                    <CWText>[{inputIdx}]</CWText>
                    <CWText>{input.type}</CWText>
                    <CWText>{input.name}</CWText>
                  </div>
                  <div>
                    <CWTextInput
                      name="Contract Input Field"
                      placeholder="Insert Input Here"
                      oninput={(e) => {
                        handleMappingAbiInputs(
                          inputIdx,
                          e.target.value,
                          fn.name,
                          this.functionNameToFunctionInputArgs
                        );
                        this.loaded = true;
                      }}
                      inputValidationFn={(
                        val: string
                      ): [ValidationStatus, string] => {
                        return validateAbiInput(val, input.type);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div class="functions-output-container">
            {fn.outputs.map((output: AbiOutput, i) => {
              const fnOutputArray = this.functionNameToFunctionOutput.get(
                fn.name
              );
              return (
                <div>
                  <div class="function-outputs">
                    <CWText>[{i}]</CWText>
                    <CWText>{output.type}</CWText>
                    <CWText>{output.name}</CWText>
                  </div>
                  <div>
                    {this.loading && <CWSpinner />}
                    <CWText>
                      {fnOutputArray && fnOutputArray[i].toString()
                        ? fnOutputArray[i].toString()
                        : ''}
                    </CWText>
                  </div>
                </div>
              );
            })}
          </div>
          <div class="function-call">
            <CWButton
              label="Create Dao"
              disabled={this.saving || this.loading}
              onclick={() => {
                notifySuccess('Create Dao button clicked!');
                this.saving = true;
                try {
                  createDao(fn);
                } catch (err) {
                  notifyError(
                    err.responseJSON?.error ||
                      'Creating Dao Function Call failed'
                  );
                }
                this.saving = false;
              }}
            />
          </div>
        </div>
      );
    };

    if (this.loadingEthChains) queryEthChains();

    return (
      <div class="CreateCommunityForm">
        {!this.loadingEthChains && ethChainRows(vnode.attrs, this.form)}
        <CWDropdown
          label="DAO Network Type (Only Ethereum is supported at this time)"
          options={[
            { label: ChainNetwork.Ethereum, value: ChainNetwork.Ethereum },
          ]}
          value={this.form.network}
          onchange={(value) => {
            this.form.network = value;
            this.loaded = true;
          }}
        />
        <CWDropdown
          label="DAO Factory Type"
          options={app.contracts.getFactoryContracts().map((factContract) => {
            return {
              label: factContract.nickname,
              value: factContract.nickname,
            };
          })}
          value={this.daoFactoryType}
          onchange={(value) => {
            this.daoFactoryType = value;
            this.loaded = true;
            console.log('loaded');
            m.redraw();
          }}
        />
        <InputRow
          title="Name"
          value={this.form.name}
          disabled={disableField}
          onChangeHandler={(v) => {
            this.form.name = v;
          }}
        />
        <IdRow id={this.form.id} />
        <InputRow
          title="Symbol"
          disabled={disableField}
          value={this.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.form.symbol = v;
          }}
        />
        <div class="GeneralContractPage">
          <CWText type="h4">General Contract</CWText>
          <CWText>Selected Dao Factory: {this.daoFactoryType}</CWText>
          <div class="functions-container">
            <div class="header-row">
              <CWText>Name</CWText>
              <CWText>State Mutability</CWText>
              <CWText>Inputs</CWText>
              <CWText>Outputs</CWText>
              <CWText>Call Function</CWText>
            </div>
            {this.daoFactoryType !== '' && renderFactoryFunction()}
          </div>
        </div>
        {...defaultChainRows(this.form, disableField)}
      </div>
    );
  }
}
