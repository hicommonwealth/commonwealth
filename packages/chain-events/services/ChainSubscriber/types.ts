import { RegisteredTypes } from '@polkadot/types/types';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { IAnyListener } from '../../src';

export type IListenerInstances = { [key: string]: IAnyListener };

export type ChainAttributes = {
  id: string;
  base: ChainBase;
  network: ChainNetwork;
  substrate_spec: RegisteredTypes;
  contract_address: string;
  verbose_logging: boolean;
  ChainNode: { id: number; url: string };
};
