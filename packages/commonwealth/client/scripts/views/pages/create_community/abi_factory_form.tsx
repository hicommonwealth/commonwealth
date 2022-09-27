/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/abi_factory_form.scss';

import { Contract } from 'models';
import app from 'state';
import { ChainBase } from 'common-common/src/types';
import Ethereum from 'controllers/chain/ethereum/main';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { AbiInput, AbiItem, AbiOutput, isAddress } from 'web3-utils';
import { BigNumber, ethers } from 'ethers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { IdRow, InputRow, SelectRow } from 'views/components/metadata_rows';

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
import {
  parseAbiItemsFromABI,
  parseWriteFunctionsFromABI,
} from 'helpers/abi_utils';
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
      daoFactoryType: 'partybidfactory',
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

    const getWeb3 = async (): Promise<Web3> => {
      const provider = new Web3.providers.WebsocketProvider(
        this.state.form.nodeUrl
      );
      const _api = new Web3(provider);
      console.log(
        `Could not connect to Ethereum on ${this.state.form.nodeUrl}`
      );
      return _api;
    };

    const getWeb3Contract = async (
      contractAddress: string
    ): Promise<Web3Contract> => {
      const contract: Contract =
        app.contracts.store.getContractByAddress(contractAddress);
      // Initialize Chain and Create contract instance
      const web3Api = await getWeb3();
      const web3Contract: Web3Contract = new web3Api.eth.Contract(
        parseAbiItemsFromABI(contract.abi),
        contractAddress
      );
      return web3Contract;
    };

    const callFunction = async (nickname: string, fn: AbiItem) => {
      // handle array and int types
      const processedArgs = fn.inputs.map((arg: AbiInput, index: number) => {
        const type = arg.type;
        if (type.substring(0, 4) === 'uint')
          return BigNumber.from(
            this.state.form.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        if (type.slice(-2) === '[]')
          return JSON.parse(
            this.state.form.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        return this.state.form.functionNameToFunctionInputArgs
          .get(fn.name)
          .get(index);
      });

      const contractAddress = app.contracts.getByNickname(nickname).address;

      const functionContract = await getWeb3Contract(contractAddress);

      // 5. Build function tx
      // Assumption is using this methodology for calling functions
      // https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#id26

      // if (fn.stateMutability !== "view" && fn.constant !== true) {
      //   // // set options for transaction
      //   const opts: any = {};
      //   if (ethToSend !== "") opts.value = ethers.utils.parseEther(ethToSend);
      //   if (gasLimit !== "" && showGasLimit) opts.gasLimit = parseInt(gasLimit);

      // } else {

      // }

      const methodSignature = `${fn.name}(${fn.inputs
        .map((input) => input.type)
        .join(',')})`;

      const functionTx = functionContract.methods[methodSignature](
        ...processedArgs
      );
      const sender = app.user.activeAccount;
      //   // get querying wallet
      const signingWallet = await app.wallets.locateWallet(
        sender,
        ChainBase.Ethereum
      );

      //   // get chain
      const chain = (app.chain as Ethereum).chain;

      const web3Api = await getWeb3();
      let tx: string;
      if (fn.stateMutability !== 'view' && fn.constant !== true) {
        // Sign Tx with PK if not view function
        tx = await chain.makeContractTx(
          contractAddress,
          functionTx.encodeABI(),
          signingWallet
        );
      } else {
        // send transaction
        tx = await chain.makeContractCall(
          contractAddress,
          functionTx.encodeABI(),
          signingWallet
        );
      }
      // simple return type
      if (fn.outputs.length === 1) {
        const decodedTx = web3Api.eth.abi.decodeParameter(
          fn.outputs[0].type,
          tx
        );
        const result: any[] = [];
        result.push(decodedTx);
        this.state.functionNameToFunctionOutput.set(fn.name, result);
      } else if (fn.outputs.length > 1) {
        const decodedTxMap = web3Api.eth.abi.decodeParameters(
          fn.outputs.map((output) => output.type),
          tx
        );
        // complex return type
        const processed = Array.from(Object.values(decodedTxMap));
        this.state.functionNameToFunctionOutput.set(fn.name, processed);
      }
    };

    const loadFactoryContractAbi = (nickname: string) => {
      const contract: Contract = app.contracts.getByNickname(nickname);
      const abiFunctions = parseWriteFunctionsFromABI(contract.abi);
      return abiFunctions;
    };

    const isProxyContract = (nickname: string) => {
      const contract: Contract = app.contracts.getByNickname(nickname);
      return contract.isProxy;
    };

    return (
      <div class="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.state.form)}
        <SelectRow
          title="DAO Type"
          options={app.contracts.store
            .getContractFactories()
            .map((contract) => contract.nickname)}
          value={this.state.form.daoFactoryType}
          onchange={(value) => {
            this.state.form.daoFactoryType = value;
            this.state.loaded = true;
            console.log('loaded');
            m.redraw();
          }}
        />
        <div class="GeneralContractPage">
          <CWText type="h4">General Contract</CWText>
          <CWText>
            Selected Dao Factory: {this.state.form.daoFactoryType}
          </CWText>
          {!isProxyContract(this.state.form.daoFactoryType) ? (
            <div class="functions-container">
              <div class="header-row">
                <CWText>Name</CWText>
                <CWText>State Mutability</CWText>
                <CWText>Inputs</CWText>
                <CWText>Outputs</CWText>
                <CWText>Call Function</CWText>
              </div>
              {loadFactoryContractAbi(this.state.form.daoFactoryType).map(
                (fn: AbiItem, fnIdx: number) => {
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
                            this.state.functionNameToFunctionOutput.get(
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
                              callFunction(this.state.form.daoFactoryType, fn);
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
                }
              )}
            </div>
          ) : (
            <div class="proxy-functions-container">
              <div class="header-row">
                <CWText>This is a Proxy</CWText>
              </div>
            </div>
          )}
        </div>
        {...defaultChainRows(this.state.form, disableField)}
      </div>
    );
  }
}
