/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/abi_factory_form.scss';

import { Contract } from 'models';
import app from 'state';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { AbiInput, AbiItem, AbiOutput, isAddress } from 'web3-utils';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { IdRow, InputRow, SelectRow } from 'views/components/metadata_rows';

import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText, ValidationStatus } from 'views/components/component_kit/cw_validation_text';

import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';

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
import { parseFunctionsFromABI } from 'helpers/abi_utils';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

type EthDaoFormFields = {
  tokenName: string;
};

type CreateFactoryDaoForm = {
  functionNameToFunctionInputArgs: Map<string, Map<number, string>>;
  daoFactoryType: string;
};

type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields &
  CreateFactoryDaoForm;

type CreateAbiFactoryState = ChainFormState & {
  functionNameToFunctionOutput: Map<string, any[]>;
  form: CreateFactoryEthDaoForm;
};

export class AbiFactoryForm implements m.ClassComponent<EthChainAttrs> {
  private state: CreateAbiFactoryState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    functionNameToFunctionOutput: new Map<string, any[]>(),
    form: {
      functionNameToFunctionInputArgs: new Map<string, Map<number, string>>(),
      daoFactoryType: '',
      address: '',
      chainString: 'Ethereum Mainnet',
      ethChainId: 1,
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
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const loadContractAbi = () => {
        const { contractAddress } = vnode.attrs;
        const contract: Contract =
          app.contracts.store.getContractByNickname(contractAddress);
        const abiFunctions = parseFunctionsFromABI(contract.abi);
        return abiFunctions;
    };

    const { contractAddress } = vnode.attrs;
    if (!app.contracts || !app.chain || !this.state.loaded) {
      return <PageLoading title="General Contract" />;
    } else {
      if (app.chain.base !== ChainBase.Ethereum) {
        return (
          <PageNotFound content="Contract ABI UI Generator Only Available for Ethereum based Chains" />
        );
      }
    }

    return (
      <div class="CreateDaoFromFactoryForm">
        <SelectRow
          title="DAO Type"
          options={app.contracts.store.getContractFactories().map(contract => contract.nickname)}
          value={this.state.form.daoFactoryType}
          onchange={(value) => {
            this.state.form.daoFactoryType = value;
            this.state.loaded = false;
          }}
        />
        <div class="GeneralContractPage">
          <CWText type="h4">General Contract</CWText>
          <CWText>Selected Dao Factory: {this.state.form.daoFactoryType}</CWText>
          <div class="functions-container">
            <div class="header-row">
              <CWText>Name</CWText>
              <CWText>State Mutability</CWText>
              <CWText>Inputs</CWText>
              <CWText>Outputs</CWText>
              <CWText>Call Function</CWText>
            </div>
            {loadContractAbi().map((fn: AbiItem, fnIdx: number) => {
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
                                if (
                                  !this.state.form.functionNameToFunctionInputArgs.has(
                                    fn.name
                                  )
                                ) {
                                  this.state.form.functionNameToFunctionInputArgs.set(
                                    fn.name,
                                    new Map<number, string>()
                                  );
                                  const inputArgMap =
                                    this.state.form.functionNameToFunctionInputArgs.get(
                                      fn.name
                                    );
                                  inputArgMap.set(inputIdx, e.target.value);
                                  this.state.form.functionNameToFunctionInputArgs.set(
                                    fn.name,
                                    inputArgMap
                                  );
                                } else {
                                  const inputArgMap =
                                    this.state.form.functionNameToFunctionInputArgs.get(
                                      fn.name
                                    );
                                  inputArgMap.set(inputIdx, e.target.value);
                                  this.state.form.functionNameToFunctionInputArgs.set(
                                    fn.name,
                                    inputArgMap
                                  );
                                }
                                this.state.loaded = true;
                              }}
                              inputValidationFn={(
                                val: string
                              ): [ValidationStatus, string] => {
                                // TODO Array Validation will be complex. Check what cases we want to cover here
                                if (input.type.slice(-2) === '[]') {
                                  if (
                                    val[0] !== '[' ||
                                    val[val.length - 1] !== ']'
                                  ) {
                                    return [
                                      'failure',
                                      'Input must be an array',
                                    ];
                                  } else {
                                    return ['success', ''];
                                  }
                                }
                                if (input.type === 'bool') {
                                  if (val !== 'true' && val !== 'false') {
                                    return [
                                      'failure',
                                      'Input must be a boolean',
                                    ];
                                  }
                                }
                                if (input.type.substring(0, 4) === 'uint') {
                                  if (!Number.isNaN(Number(val))) {
                                    return ['success', ''];
                                  } else {
                                    return [
                                      'failure',
                                      'Input must be a number',
                                    ];
                                  }
                                } else if (input.type === 'bool') {
                                  if (val === 'true' || val === 'false') {
                                    return ['success', ''];
                                  } else {
                                    return [
                                      'failure',
                                      'Input must be a boolean',
                                    ];
                                  }
                                } else if (input.type === 'address') {
                                  if (val.length === 42) {
                                    return ['success', ''];
                                  } else {
                                    return [
                                      'failure',
                                      'Input must be an address',
                                    ];
                                  }
                                } else {
                                  return ['success', ''];
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div class="functions-output-container">
                    {fn.outputs.map((output: AbiOutput, i) => {
                      const fnOutputArray =
                        this.state.functionNameToFunctionOutput.get(fn.name);
                      return (
                        <div>
                          <div class="function-outputs">
                            <CWText>[{i}]</CWText>
                            <CWText>{output.type}</CWText>
                            <CWText>{output.name}</CWText>
                          </div>
                          <div>
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
                      label="Submit"
                      disabled={this.state.saving || !this.state.loaded}
                      onclick={() => {
                        notifySuccess('Submit Call button clicked!');
                        this.state.saving = true;
                        try {
                          callFunction(contractAddress, fn);
                        } catch (err) {
                          notifyError(
                            err.responseJSON?.error ||
                              'Submitting Function Call failed'
                          );
                        } finally {
                          this.state.saving = false;
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
