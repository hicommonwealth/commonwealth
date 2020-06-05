import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { IMolochEventData } from './types';
import { MolochApi } from '.';

export default class extends IStorageFetcher<MolochApi> {
  public async fetch(range?: IDisconnectedRange): Promise<CWEvent<IMolochEventData>[]> {
    throw new Error('Moloch storage fetching not implemented.');
  }
}
