// Create controller for contract model
//
// Language: typescript
// Path: packages/commonwealth/client/scripts/controllers/server/contracts.ts

import $ from 'jquery';
import _ from 'lodash';

import { ContractsStore } from 'stores';
import { Contract } from 'models';
import app from 'state';
import BN from 'bn.js';

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

    // TODO: Add a method to add a contract via post request
    // public async add(
    //     address: string,
    //     chainNodeId: number,
    //     abi: string,
    //     type: string
    // ) {
    //     try {
    //       // TODO: Change to POST /topic
    //       const response = await $.post(`${app.serverUrl()}/createContract`, {
    //         address,
    //         chainNodeId,
    //         abi,
    //         type
    //       });
    //       const result = new Contract(response.result);
    //       if (this._store.getById(result.id)) {
    //         this._store.remove(this._store.getById(result.id));
    //       }
    //       this._store.add(result);
    //       return result;
    //     } catch (err) {
    //       console.log('Failed to edit topic');
    //       throw new Error(
    //         err.responseJSON && err.responseJSON.error
    //           ? err.responseJSON.error
    //           : 'Failed to edit topic'
    //       );
    //     }
    // }

}

export default ContractsController;