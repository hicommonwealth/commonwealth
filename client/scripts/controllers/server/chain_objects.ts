import { default as $ } from 'jquery';
import app from 'state';
import { ChainObject } from 'models';

export default class ChainObjectController<T> {
  constructor(
    public readonly objectType: string
  ) { }

  public async forceUpdate(type: string): Promise<Array<ChainObject<T>>> {
    const queryArgs = { chain_object_id: this.objectType, fetch_type: type };
    const resp = await $.get(`${app.serverUrl()}/refreshChainObjects`, queryArgs);
    if (resp.status !== 'Success') {
      throw new Error('failed to update chain objects');
    }
    return resp.result.map((json) => ChainObject.fromJSON(json));
  }

  public async fetch(completed?: boolean, objectId?: string): Promise<Array<ChainObject<T>>> {
    const queryArgs: any = { object_type: this.objectType };
    if (completed !== undefined) {
      queryArgs.completed = completed;
    }
    if (objectId !== undefined) {
      queryArgs.object_id = objectId;
    }
    const resp = await $.get(`${app.serverUrl()}/viewChainObjects`, queryArgs);
    if (resp.status !== 'Success') {
      throw new Error('failed to fetch chain objects');
    }
    return resp.result.map((json) => ChainObject.fromJSON(json));
  }
}
