import $ from 'jquery';
import _ from 'lodash';

import { ContractsStore } from 'stores';
import { Contract } from 'models';
import app from 'state';
import BN from 'bn.js';
import { ChainBase, ContractType } from 'common-common/src/types';
import { TypedResponse } from 'server/types';
import { ChainNodeAttributes } from 'server/models/chain_node';
import { ContractAttributes } from 'server/models/contract';
import { ContractAbiAttributes } from 'server/models/contract_abi';

type CreateContractResp = {
  contract: ContractAttributes;
  node: ChainNodeAttributes;
};
type CreateContractAbiResp = {
  contractAbi: ContractAbiAttributes;
  contract: ContractAttributes;
};
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
    const resultAbi: ContractAbiAttributes =
      response['result']['contractAbi'];
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
    this._store.add(
      new Contract(
        contractAttributes.id,
        contractAttributes.address,
        contractAttributes.chain_node_id,
        contractAttributes.type,
        contractAttributes.createdAt,
        contractAttributes.updatedAt,
        contractAttributes.decimals,
        contractAttributes.token_name,
        contractAttributes.symbol,
        contractAbi,
        contractAttributes.is_factory,
        contractAttributes.nickname,
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
      const responseContract = response['result']['contract'];
      const result = new Contract(
        responseContract.id,
        responseContract.address,
        responseContract.abi,
        responseContract.contractType,
        responseContract.symbol,
        responseContract.token_name,
        responseContract.decimals
      );
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to create contract', err);
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to create contract'
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
