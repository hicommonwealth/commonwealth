import $ from 'jquery';

import { ContractsStore } from 'stores';
import { Contract } from 'models';
import app from 'state';
import { ChainBase, ContractType } from 'common-common/src/types';
import { TypedResponse } from 'server/types';
import { ContractAttributes } from 'server/models/contract';
import { ContractAbiAttributes } from 'server/models/contract_abi';
import { CreateContractResp } from 'server/routes/contracts/createContract';
import { CreateContractAbiResp } from 'server/routes/contractAbis/createContractAbi';

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
    const response: TypedResponse<CreateContractAbiResp> = await $.post(
      `${app.serverUrl()}/createContractAbi`,
      {
        jwt: app.user.jwt,
        contractId: contract.id,
        abi,
      }
    );
    const resultContract: ContractAttributes = response['result']['contract'];
    const resultAbi: ContractAbiAttributes = response['result']['contractAbi'];
    this.update(resultAbi.abi, resultContract);
    return response;
  }
  public async update(
    contractAbi: Array<Record<string, unknown>>,
    contractAttributes: ContractAttributes
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
      new Contract(
        id,
        address,
        chain_node_id,
        type,
        createdAt,
        updatedAt,
        decimals,
        token_name,
        symbol,
        contractAbi,
        is_factory,
        nickname
      )
    );
  }

  public async add(
    community: string,
    chain_base: ChainBase,
    chain_node_id: number,
    node_url: string,
    address: string,
    abi: JSON,
    contractType: ContractType,
    symbol: string,
    token_name: string,
    decimals: number
  ) {
    try {
      const response: TypedResponse<CreateContractResp> = await $.post(
        `${app.serverUrl()}/createContract`,
        {
          community,
          chain_base,
          chain_node_id,
          jwt: app.user.jwt,
          node_url,
          address,
          abi,
          contractType,
          symbol,
          token_name,
          decimals,
        }
      );
      const responseContract: ContractAttributes =
        response['result']['contract'];
      const {
        id,
        type,
        is_factory,
        nickname,
        createdAt,
        updatedAt,
      } = responseContract;
      const result = new Contract(
        id,
        address,
        chain_node_id,
        type,
        createdAt,
        updatedAt,
        decimals,
        token_name,
        symbol,
        abi,
        is_factory,
        nickname,
      );
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to create and add contract', err);
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to create and add contract'
      );
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
          abiJson = JSON.parse(contract.ContractAbi.abi);
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
