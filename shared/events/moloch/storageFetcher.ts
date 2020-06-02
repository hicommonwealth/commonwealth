import { CWEvent, IStorageFetcher } from '../interfaces';
import { IMolochEventData } from './types';
import { MolochApi } from '.';

export default class extends IStorageFetcher<MolochApi> {
  public async fetch(): Promise<CWEvent<IMolochEventData>[]> {
    throw new Error('Moloch migration not implemented.');
  }
}
