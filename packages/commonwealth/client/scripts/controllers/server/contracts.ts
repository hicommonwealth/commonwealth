import { Contract } from 'models';

import { ContractsStore } from 'stores';

class ContractsController {
  private _store: ContractsStore = new ContractsStore();
  private _initialized = false;

  public get store() {
    return this._store;
  }

  public get initialized() {
    return this._initialized;
  }

  public getByIdentifier(id) {
    return this._store.getById(id);
  }

  public getByType(type: string) {
    return this._store.getContractByType(type);
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
        this._store.add(
          Contract.fromJSON({
            ...contract,
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
