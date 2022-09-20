/* @jsx m */

import 'pages/general_contract/index.scss';
import app from 'state';
import { Contract } from 'models';
import m from 'mithril';
import EthereumChain from 'controllers/chain/ethereum/chain';
import Ethereum from 'controllers/chain/ethereum/main';
import { notifySuccess } from 'controllers/app/notifications';
import { BigNumber, ethers } from 'ethers';
import { AbiItem, AbiInput, AbiOutput } from 'web3-utils/types';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { ChainBase } from 'common-common/src/types';
import {
  parseAbiItemsFromABI,
  parseFunctionsFromABI,
  getEtherscanABI,
} from '../../../helpers/abi_utils';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { ChainFormState } from '../create_community/types';

type CreateContractForm = {
  functionItemToFunctionInputArgs: Map<AbiItem, Map<AbiInput, string>>;
};

type CreateContractState = ChainFormState & { form: CreateContractForm };
class GeneralContractPage
  implements m.ClassComponent<{ contractAddress?: string }>
{
  private state: CreateContractState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      functionItemToFunctionInputArgs: new Map<AbiItem, Map<AbiInput, string>>(),
    },
  };

  view(vnode) {

    // Payable functions are not supported in this implementation

    const getWeb3Contract = async (): Promise<Web3Contract> => {
      const { contractAddress } = vnode.attrs;
      const ethChain = app.chain.chain as EthereumChain;
      const contract: Contract =
        app.contracts.store.getContractByAddress(contractAddress);
      // Initialize Chain and Create contract instance
      const currChain = app.chain
      const currNode = currChain.meta.ChainNode
      const web3Api = await ethChain.initApi(currNode);
      const web3Contract: Web3Contract = new web3Api.eth.Contract(
        parseAbiItemsFromABI(contract.abi),
        contractAddress
      );
      return web3Contract;
    };

    const callFunction = async (contractAddress: string, fn: AbiItem) => {
      // handle array and int types
      // const processedArgs = fn.inputs.map((arg: AbiInput) => {
      //   const type = arg.type;
      //   if (type.substring(0, 4) === 'uint')
      //   return BigNumber.from(this.functionItemToFunctionInputArgs.get(fn).get(arg));
      //   if (type.slice(-2) === '[]') return JSON.parse(this.functionItemToFunctionInputArgs.get(fn).get(arg));
      //   return this.functionItemToFunctionInputArgs.get(fn).get(arg);
      // });

      // This is for testing only
      contractAddress = '0xdb355da657A3795bD6Faa9b63915cEDbE4fAdb00';
      const processedArgs = ['0xE4452Cb39ad3Faa39434b9D768677B34Dc90D5dc']

      console.log(processedArgs);

      const functionContract = await getWeb3Contract();

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

      const methodSignature = `${fn.name  }(${  fn.inputs.map((input) => input.type).join(",")})`;

      const functionTx = functionContract.methods[methodSignature](...processedArgs);
      const sender = app.user.activeAccount;
      //   // get querying wallet
      const signingWallet = await app.wallets.locateWallet(
        sender,
        ChainBase.Ethereum
      );

      //   // get chain
      const chain = (app.chain as Ethereum).chain;

      if (fn.stateMutability !== 'view' && fn.constant !== true) {
        // Sign Tx with PK if not view function
        const createTransaction = await chain.makeContractTx(
          contractAddress,
          functionTx.encodeABI(),
          signingWallet,
        );
        console.log('Tx successful with hash:', createTransaction);
      } else {
        console.log('view function called');
        // send transaction
        const tx = await chain.makeContractCall(
          contractAddress,
          functionTx.encodeABI(),
          signingWallet,
        );
        console.log("Tx successful with hash:", tx);
      }
    };

    // TODO: figure out when to use this method properly
    const loadAbiFromEtherscan = async () => {
      const { contractAddress } = vnode.attrs;
      try {
        const etherscanAbi = await getEtherscanABI('mainnet', contractAddress);
        const abiString = JSON.stringify(etherscanAbi);
        return parseFunctionsFromABI(abiString);
      } catch (error) {
        console.log(error);
      }
    };

    const loadContractAbi = () => {
      const { contractAddress } = vnode.attrs;
      const contract: Contract =
        app.contracts.store.getContractByAddress(contractAddress);
      const abiFunctions = parseFunctionsFromABI(contract.abi);
      if (abiFunctions) {
        return abiFunctions;
      } else {
        loadAbiFromEtherscan();
      }
    };

    const { contractAddress } = vnode.attrs;
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
        <div class="GeneralContractPage">
          <CWText type="h4">General Contract</CWText>
          <CWText>Contract Address: {contractAddress}</CWText>
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
                                if (!this.state.form.functionItemToFunctionInputArgs.has(fn)) {
                                  this.state.form.functionItemToFunctionInputArgs.set(fn, new Map<AbiInput, string>());
                                }
                                const inputArgMap = this.state.form.functionItemToFunctionInputArgs.get(fn);
                                inputArgMap.set(input, e.target.value);
                                this.state.form.functionItemToFunctionInputArgs.set(fn, inputArgMap);
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
                      return (
                        <div class="function-outputs">
                          <CWText>[{i}]</CWText>
                          <CWText>{output.type}</CWText>
                          <CWText>{output.name}</CWText>
                        </div>
                      );
                    })}
                  </div>
                  <div class="function-call">
                    <CWButton
                      label="Submit"
                      onclick={() => {
                        notifySuccess('Submit Call button clicked!');
                        callFunction(contractAddress, fn);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default GeneralContractPage;
