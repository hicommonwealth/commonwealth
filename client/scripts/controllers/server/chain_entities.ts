/* eslint-disable no-restricted-syntax */
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';

import { ChainEntityStore } from 'stores';
import { ChainEntity } from 'models';
import app from 'state';

const get = (route, args, callback) => {
  return $.get(app.serverUrl() + route, args).then((resp) => {
    if (resp.status === 'Success') {
      callback(resp.result);
    } else {
      console.error(resp);
    }
  }).catch((e) => console.error(e));
};

class ChainEntityController {
  private _store: ChainEntityStore = new ChainEntityStore();
  public get store() { return this._store; }

  public constructor() {
    // do nothing
  }

  public refresh(chain) {
    return get('/bulkEntities', { chain }, (result) => {
      for (const entityJSON of result) {
        const entity = ChainEntity.fromJSON(entityJSON);
        this._store.add(entity);
      }
    });
  }

  public deinit() {
    this.store.clear();
  }
}

export default ChainEntityController;
