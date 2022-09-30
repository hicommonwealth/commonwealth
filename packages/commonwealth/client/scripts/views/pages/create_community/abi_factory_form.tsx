/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/abi_factory_form.scss';

import { Contract, NodeInfo } from 'models';
import app from 'state';
import { initAppState } from 'app';
import { ChainBase, ChainNetwork, ChainType, WalletId } from 'common-common/src/types';
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
  parseEventFromABI,
  parseFunctionFromABI,
} from 'helpers/abi_utils';
import { factoryNicknameToCreateFunctionName } from 'helpers/types';
import EthereumChain from 'controllers/chain/ethereum/chain';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { slugifyPreserveDashes } from 'utils';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

type EthDaoFormFields = {
  network: ChainNetwork.Ethereum;
  tokenName: string;
};

type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields;

type CreateAbiFactoryState = ChainFormState & {
  functionNameToFunctionOutput: Map<string, any[]>;
  functionNameToFunctionInputArgs: Map<string, Map<number, string>>;
  daoFactoryType: string;
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
    functionNameToFunctionInputArgs: new Map<string, Map<number, string>>(),
    daoFactoryType: 'partybidfactory',
    form: {
      address: '',
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
    const Bytes32 = ethers.utils.formatBytes32String;

    const disableField = !this.state.loaded;

    const getCurrChain = async (
      contractAddress: string
    ): Promise<EthereumChain> => {
      try {
        const contract: Contract =
          app.contracts.store.getContractByAddress(contractAddress);
        let chainNodeId = 1;
        if (contract.chainNodeId) {
          chainNodeId = contract.chainNodeId;
        }
        const nodeObj: NodeInfo = app.config.nodes.getNodesByChainId(chainNodeId);

        const ethChain = new EthereumChain(app);

        const ethApi = await ethChain.init(nodeObj);

        return ethChain;
      } catch (e) {
        console.error(e);
        console.log(`App Error: ${e.message}`);
      }
    };

    const getWeb3Contract = async (
      contractAddress: string
    ): Promise<Web3Contract> => {
      const contract: Contract =
        app.contracts.store.getContractByAddress(contractAddress);
      // Initialize Chain and Create contract instance
      const chain = await getCurrChain(contractAddress);
      const web3Contract: Web3Contract = new chain.api.eth.Contract(
        parseAbiItemsFromABI(contract.abi),
        contractAddress
      );
      return web3Contract;
    };

    const createDao = async (nickname: string, fn: AbiItem) => {
      const { chainString, ethChainId, nodeUrl, tokenName, symbol } =
      this.state.form;
      this.state.saving = true;

      // handle array and int types
      const processedArgs = fn.inputs.map((arg: AbiInput, index: number) => {
        const type = arg.type;
        if (type.substring(0, 4) === 'uint')
          return BigNumber.from(
            this.state.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        if (type.substring(0, 4) === 'byte')
          return Bytes32(
            this.state.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        if (type.slice(-2) === '[]')
          return JSON.parse(
            this.state.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        return this.state.functionNameToFunctionInputArgs
          .get(fn.name)
          .get(index);
      });

      const contract = app.contracts.getByNickname(nickname);
      const functionContract = await getWeb3Contract(contract.address);

      const methodSignature = `${fn.name}(${fn.inputs
        .map((input) => input.type)
        .join(',')})`;

      const functionTx = functionContract.methods[methodSignature](
        ...processedArgs
      );

      //   // get querying wallet
      const availableWallets = app.wallets.availableWallets(ChainBase.Ethereum);
      if (availableWallets.length === 0) {
        throw new Error('No wallet available');
      }
      // For now, we will only enable metamaskWallet, but this can change. Per discussion with Dillon

      const metamaskWallet = availableWallets.find(
        (wallet) => wallet.name === WalletId.Metamask
      );
      if (!metamaskWallet.enabled) {
        await metamaskWallet.enable();
      }

      const chain = await getCurrChain(contract.address);
      if (fn.stateMutability !== 'view' && fn.constant !== true) {
        if (contract.nickname === 'curated-factory-goerli') {
          const eventAbiItem = parseEventFromABI(
            contract.abi,
            'ProjectCreated'
          );

          // Sign Tx with PK if not view function
          chain
            .makeContractTx(
              contract.address,
              functionTx.encodeABI(),
              metamaskWallet
            )
            .then(async (txReceipt) => {
              console.log('txReceipt', txReceipt);
              const decodedLog = chain.api.eth.abi.decodeLog(
                eventAbiItem.inputs,
                txReceipt.logs[0].data,
                txReceipt.logs[0].topics
              );
              console.log('decodedLog', decodedLog);
              this.state.form.address = decodedLog.projectAddress;
              console.log('state.form.address', this.state.form.address);
              try {
                const res = await $.post(`${app.serverUrl()}/createChain`, {
                  base: ChainBase.Ethereum,
                  chain_string: chainString,
                  eth_chain_id: ethChainId,
                  jwt: app.user.jwt,
                  node_url: nodeUrl,
                  token_name: tokenName,
                  type: ChainType.DAO,
                  default_symbol: symbol,
                  ...this.state.form,
                });
                if (res.result.admin_address) {
                  await linkExistingAddressToChainOrCommunity(
                    res.result.admin_address,
                    res.result.role.chain_id,
                    res.result.role.chain_id
                  );
                }
                await initAppState(false);
                // TODO: notify about needing to run event migration
                m.route.set(`/${res.result.chain?.id}`);
              } catch (err) {
                notifyError(
                  err.responseJSON?.error ||
                    'Creating new ETH DAO community failed'
                );
              } finally {
                this.state.saving = false;
              }
            });
        }
      }
    };

    const loadFactoryContractAbi = (nickname: string) => {
      const contract: Contract = app.contracts.getByNickname(nickname);
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
                        if (
                          !this.state.functionNameToFunctionInputArgs.has(
                            fn.name
                          )
                        ) {
                          this.state.functionNameToFunctionInputArgs.set(
                            fn.name,
                            new Map<number, string>()
                          );
                          const inputArgMap =
                            this.state.functionNameToFunctionInputArgs.get(
                              fn.name
                            );
                          inputArgMap.set(inputIdx, e.target.value);
                          this.state.functionNameToFunctionInputArgs.set(
                            fn.name,
                            inputArgMap
                          );
                        } else {
                          const inputArgMap =
                            this.state.functionNameToFunctionInputArgs.get(
                              fn.name
                            );
                          inputArgMap.set(inputIdx, e.target.value);
                          this.state.functionNameToFunctionInputArgs.set(
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
                          if (val[0] !== '[' || val[val.length - 1] !== ']') {
                            return ['failure', 'Input must be an array'];
                          } else {
                            return ['success', ''];
                          }
                        }
                        if (input.type === 'bool') {
                          if (val !== 'true' && val !== 'false') {
                            return ['failure', 'Input must be a boolean'];
                          }
                        }
                        if (input.type.substring(0, 4) === 'uint') {
                          if (!Number.isNaN(Number(val))) {
                            return ['success', ''];
                          } else {
                            return ['failure', 'Input must be a number'];
                          }
                        } else if (input.type === 'bool') {
                          if (val === 'true' || val === 'false') {
                            return ['success', ''];
                          } else {
                            return ['failure', 'Input must be a boolean'];
                          }
                        } else if (input.type === 'address') {
                          if (val.length === 42) {
                            return ['success', ''];
                          } else {
                            return ['failure', 'Input must be an address'];
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
              disabled={this.state.saving}
              onclick={() => {
                notifySuccess('Create Dao button clicked!');
                this.state.saving = true;
                try {
                  createDao(this.state.daoFactoryType, fn);
                } catch (err) {
                  notifyError(
                    err.responseJSON?.error || 'Submitting Function Call failed'
                  );
                } finally {
                  this.state.saving = false;
                }
              }}
            />
          </div>
        </div>
      );
    };

    return (
      <div class="CreateCommunityForm">
        <SelectRow
          title="DAO Type"
          options={app.contracts.store
            .getContractFactories()
            .map((contract) => contract.nickname)}
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
          <CWText>
            Selected Dao Factory: {this.state.daoFactoryType}
          </CWText>
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
