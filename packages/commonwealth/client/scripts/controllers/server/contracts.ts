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
  public getByNickname(nickname: string) {
    return this._store.getContractByNickname(nickname);
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
  public getContractFactories() {
    return this._store.getContractFactories();
  }
  public getCommunityContracts() {
    return this._store.getCommunityContracts();
  }

  public async addContractAbi(
    contract: Contract,
    abi: Array<Record<string, unknown>>
  ) {
    const response = await $.post(`${app.serverUrl()}/createContractAbi`, {
      jwt: app.user.jwt,
      contractId: contract.id,
      abi,
    });
    const resultContract = response['result']['contract'];
    const resultAbi = response['result']['contractAbi'];
    this.update(resultAbi.abi, resultContract);
    return response;
  }

  public async checkFetchEtherscanForAbi(address: string) {
    try {
      const response: Response = await $.post(
        `${app.serverUrl()}/etherscanAPI/fetchEtherscanContract`,
        {
          address,
        }
      );
      console.log(response);
      const resultContract = response['result']['contract'];
      const resultAbi = response['result']['contractAbi'];
      this.update(resultAbi.abi, resultContract);
    } catch (err) {
      console.log('Failed to fetch abi from etherscan', err);
      throw new Error(err);
    }
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
    contractType,
    symbol,
    token_name,
    decimals,
  }: {
    community: string;
    balance_type: BalanceType;
    chain_node_id: number;
    node_url: string;
    address: string;
    abi: string;
    contractType: ContractType;
    symbol: string;
    token_name: string;
    decimals: number;
  }) {
    try {
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
      });
      const responseContract = response['result']['contract'];
      const { id, type, is_factory, nickname } = responseContract;
      const result = new Contract({
        id,
        address,
        chainNodeId: chain_node_id,
        type,
        decimals,
        tokenName: token_name,
        symbol,
        abi: JSON.parse(abi),
        isFactory: is_factory,
        nickname,
      });
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to create and add contract', err);
      throw new Error(err);
    }
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
