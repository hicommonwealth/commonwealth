import { CWEvent } from '../interfaces';
import { IMolochEventData } from './types';
import { MolochApi } from '.';

export default async function (
  api: MolochApi
): Promise<CWEvent<IMolochEventData>[]> {
  throw new Error('Moloch migration not implemented.');
}
