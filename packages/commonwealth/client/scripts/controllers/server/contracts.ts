import $ from 'jquery';
import { Response } from 'express';
import { ContractsStore } from 'stores';
import { Contract } from 'models';
import app from 'state';
import { BalanceType, ContractType } from 'common-common/src/types';

class ContractsController {
  private _store: ContractsStore = new ContractsStore();
  private _initialized = false;
  public get store() {
    return this._store;
  }
  public get initialized() {
    return this._initialized;
  }
  public getFactoryContractByNickname(nickname: string) {
    return this._store.getFactoryContractByNickname(nickname);
  }
  public getFactoryContracts() {
    return this._store.getFactoryContracts();
  }
  public getByIdentifier(id) {
    return this._store.getById(id);
  }
  public getByAddress(address: string) {
    return this._store.getContractByAddress(address);
  }
  public getByType(type: string) {
    return this._store.getContractByType(type);
  }
  public getCommunityContracts() {
    return this._store.getCommunityContracts();
  }

  public async addContractAbi(
    contract: Contract,
    abi: string,
    nickname: string
  ) {
    const response = await $.post(`${app.serverUrl()}/createContractAbi`, {
      jwt: app.user.jwt,
      contractId: contract.id,
      abi,
      nickname,
    });
    const resultContract = response['result']['contract'];
    const resultAbi = response['result']['contractAbi'];
    this.update(resultAbi.abi, resultContract);
    return response;
  }

  public async checkFetchEtherscanForAbi(address: string) {
    const response: Response = await $.post(
      `${app.serverUrl()}/etherscanAPI/fetchEtherscanContract`,
      {
        address,
        jwt: app.user.jwt,
      }
    );
    const resultContract = response['result']['contract'];
    const resultAbi = response['result']['contractAbi'];
    this.update(resultAbi.abi, resultContract);
  }

  public async fetchFactoryContracts() {
    // Fetch factory contracts from server and add to store if not already there
    const params = {
      isFactory: true,
    };
    const response = await $.get(`${app.serverUrl()}/getContracts`, params);
    const contracts = response.result.contracts;

    contracts.forEach((contract) => {
      const {
        id,
        address,
        chain_node_id,
        type,
        created_at,
        updated_at,
        decimals,
        token_name,
        symbol,
        is_factory,
        nickname,
        ContractAbi,
        ChainNode
      } = contract;

      const result = new Contract({
        id,
        address,
        chainNodeId: chain_node_id,
        type,
        createdAt: created_at,
        updatedAt: updated_at,
        decimals,
        tokenName: token_name,
        symbol,
        isFactory: is_factory,
        nickname,
        abi: ContractAbi.abi,
        contractAbi: ContractAbi,
        ethChainId: ChainNode.eth_chain_id
      });
      this._store.add(result);
    });
  }

  public async update(
    abi: Array<Record<string, unknown>>,
    contractAttributes: any
  ) {
    // Update contract in store
    if (this._store.getById(contractAttributes.id)) {
      this._store.remove(this._store.getById(contractAttributes.id));
    }
    const {
      id,
      address,
      chain_node_id,
      type,
      createdAt,
      updatedAt,
      decimals,
      token_name,
      symbol,
      is_factory,
      nickname,
      ChainNode
    } = contractAttributes;
    this._store.add(
      new Contract({
        id,
        address,
        chainNodeId: chain_node_id,
        type,
        createdAt,
        updatedAt,
        decimals,
        tokenName: token_name,
        symbol,
        abi,
        isFactory: is_factory,
        nickname,
        ethChainId: ChainNode.eth_chain_id
      })
    );
  }

  public async add({
    community,
    balance_type,
    chain_node_id,
    node_url,
    address,
    abi,
    abiNickname,
    contractType,
    symbol,
    token_name,
    decimals,
    nickname,
    eth_chain_id
  }: {
    community: string;
    balance_type: BalanceType;
    chain_node_id: number;
    node_url: string;
    address: string;
    abi?: string;
    abiNickname?: string;
    contractType: ContractType;
    symbol: string;
    token_name: string;
    decimals: number;
    nickname: string;
    eth_chain_id: number;
  }) {
    const response = await $.post(`${app.serverUrl()}/createContract`, {
      community,
      balance_type,
      chain_node_id,
      jwt: app.user.jwt,
      node_url,
      address,
      abi,
      contractType,
      symbol,
      token_name,
      decimals,
      nickname,
      abiNickname,
      eth_chain_id
    });
    const responseContract = response['result']['contract'];
    const { id, type, is_factory } = responseContract;
    const result = new Contract({
      id,
      address,
      chainNodeId: chain_node_id,
      type,
      decimals,
      tokenName: token_name,
      symbol,
      abi: abi !== undefined ? JSON.parse(abi) : abi,
      isFactory: is_factory,
      nickname,
      ethChainId: eth_chain_id
    });
    if (this._store.getById(result.id)) {
      this._store.remove(this._store.getById(result.id));
    }
    this._store.add(result);
    return result;
  }
  public addToStore(contract: Contract) {
    return this._store.add(contract);
  }
  public initialize(contracts = [], reset = true) {
    if (reset) {
      this._store.clear();
    }
    contracts.forEach((contract) => {
      try {
        let abiJson: Array<Record<string, unknown>>;
        if (contract.ContractAbi) {
          // Necessary because the contract abi was stored as a string in some contracts
          if (typeof contract.ContractAbi.abi === 'string') {
            abiJson = JSON.parse(contract.ContractAbi.abi);
          } else {
            abiJson = contract.ContractAbi.abi;
          }
        }
        this._store.add(
          Contract.fromJSON({
            ...contract,
            abi: abiJson,
            contractAbi: contract.ContractAbi,
            ethChainId: contract.ChainNode.eth_chain_id
          })
        );
      } catch (e) {
        console.error(e);
      }
    });

    this._initialized = true;
  }
}

export default ContractsController;
