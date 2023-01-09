/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/abi_factory_form.scss';

import app from 'state';
import {
  ChainNetwork,
  factoryNicknameToCreateFunctionName,
  WalletId,
} from 'common-common/src/types';
import { AbiInput, AbiItem, AbiOutput, isAddress } from 'web3-utils';
import { BigNumber, ethers } from 'ethers';
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
  ChainFormFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from 'views/pages/create_community/types';

import { slugifyPreserveDashes } from 'utils';
import { Contract } from 'models';
import GeneralContractsController from 'controllers/chain/ethereum/generalContracts';
import { Spinner } from 'construct-ui';
import {
  handleMappingAbiInputs,
  processAbiInputsToDataTypes,
  validateAbiInput,
} from 'helpers/abi_form_helpers';
import { parseFunctionFromABI } from 'shared/abi_utils';
import ClassComponent from 'class_component';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

type EthDaoFormFields = {
  network: ChainNetwork.Ethereum;
  tokenName: string;
};

type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields;

type CreateAbiFactoryState = ChainFormState & {
  ethChainNames: any;
  ethChains: any;
  loadingEthChains: boolean;
  functionNameToFunctionOutput: Map<string, any[]>;
  functionNameToFunctionInputArgs: Map<string, Map<number, string>>;
  daoFactoryType: string;
  form: CreateFactoryEthDaoForm;
};

export class AbiFactoryForm extends ClassComponent<EthChainAttrs> {
  generalContractsController: GeneralContractsController;
  private state: CreateAbiFactoryState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    ethChainNames: {},
    ethChains: {},
    loadingEthChains: true,
    functionNameToFunctionOutput: new Map<string, any[]>(),
    functionNameToFunctionInputArgs: new Map<string, Map<number, string>>(),
    daoFactoryType: 'curated-factory-goerli',
    form: {
      chainString: 'Ethereum Mainnet',
      ethChainId: 1,
      network: ChainNetwork.Ethereum,
      id: '',
      name: '',
      nodeUrl: '',
      symbol: '',
      tokenName: 'token',
      ...initChainForm(),
    },
  };

  oninit(vnode) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode) {
    const queryEthChains = async () => {
      // query eth chains
      $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(
        async (res) => {
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
        }
      );
    };

    const initContractController = async (contract: Contract) => {
      // initialize daoFactory Controller with web3 object initialized with the selected chain's nodeUrl
      const provider = new Web3.providers.WebsocketProvider(
        this.state.form.nodeUrl
      );
      const _api = new Web3(provider);

      this.generalContractsController = new GeneralContractsController(
        _api,
        contract
      );
    };

    const disableField = !this.state.loaded;

    const createDao = async (fn: AbiItem) => {
      this.state.loading = true;
      // handle processing the forms inputs into their proper data types
      const processedArgs = processAbiInputsToDataTypes(
        fn.name,
        fn.inputs,
        this.state.functionNameToFunctionInputArgs
      );
      try {
        const metamaskWallet =
          await app.wallets.getFirstAvailableMetamaskWallet();

        await this.generalContractsController.createFactoryDao(
          fn,
          processedArgs,
          metamaskWallet,
          this.state.form
        );
      } catch (err) {
        notifyError(
          err.responseJSON?.error ||
            'Creating new ETH DAO Factory based community failed'
        );
        this.state.status = 'failure';
        this.state.message = err.message;
        this.state.loading = false;
        m.redraw();
        return;
      }
      this.state.loaded = true;
      this.state.loading = false;
      m.redraw();
    };

    const loadFactoryContractAbi = (nickname: string) => {
      const contract: Contract =
        app.contracts.getFactoryContractByNickname(nickname);
      const factoryFn = factoryNicknameToCreateFunctionName[nickname];
      if (!factoryFn) return null;
      const abiFunction = parseFunctionFromABI(contract.abi, factoryFn);
      return abiFunction;
    };

    const renderFactoryFunction = () => {
      const fn = loadFactoryContractAbi(this.state.daoFactoryType);
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
                          this.state.functionNameToFunctionInputArgs
                        );
                        this.state.loaded = true;
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
              const fnOutputArray = this.state.functionNameToFunctionOutput.get(
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
                    {this.state.loading && <CWSpinner />}
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
              disabled={this.state.saving || this.state.loading}
              onclick={() => {
                notifySuccess('Create Dao button clicked!');
                this.state.saving = true;
                try {
                  createDao(fn);
                } catch (err) {
                  notifyError(
                    err.responseJSON?.error ||
                      'Creating Dao Function Call failed'
                  );
                }
                this.state.saving = false;
              }}
            />
          </div>
        </div>
      );
    };

    if (this.state.loadingEthChains) queryEthChains();

    const contract = app.contracts.getFactoryContractByNickname(
      this.state.daoFactoryType
    );
    initContractController(contract);

    return (
      <div class="CreateCommunityForm">
        {!this.state.loadingEthChains &&
          ethChainRows(vnode.attrs, this.state.form)}
        <CWDropdown
          label="DAO Network Type (Only Ethereum is supported at this time)"
          options={[
            { label: ChainNetwork.Ethereum, value: ChainNetwork.Ethereum },
          ]}
          value={this.state.form.network}
          onchange={(value) => {
            this.state.form.network = value;
            this.state.loaded = true;
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
          value={this.state.daoFactoryType}
          onchange={(value) => {
            this.state.daoFactoryType = value;
            this.state.loaded = true;
            console.log('loaded');
            m.redraw();
          }}
        />
        <InputRow
          title="Name"
          value={this.state.form.name}
          disabled={disableField}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
          }}
        />
        <IdRow id={this.state.form.id} />
        <InputRow
          title="Symbol"
          disabled={disableField}
          value={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <div class="GeneralContractPage">
          <CWText type="h4">General Contract</CWText>
          <CWText>Selected Dao Factory: {this.state.daoFactoryType}</CWText>
          <div class="functions-container">
            <div class="header-row">
              <CWText>Name</CWText>
              <CWText>State Mutability</CWText>
              <CWText>Inputs</CWText>
              <CWText>Outputs</CWText>
              <CWText>Call Function</CWText>
            </div>
            {this.state.daoFactoryType !== '' && renderFactoryFunction()}
          </div>
        </div>
        {...defaultChainRows(this.state.form, disableField)}
      </div>
    );
  }
}
