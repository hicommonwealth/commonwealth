import type { ChainBase, ChainNetwork } from 'common-common/src/types';
import type { RegisteredTypes } from '@polkadot/types/types';

import type { IAnyListener } from '../../src';

export type IListenerInstances = { [key: string]: IAnyListener };

export type ChainAttributes = {
  base: ChainBase;
  network: ChainNetwork;
  substrate_spec: RegisteredTypes;
  contract_address: string;
  verbose_logging: boolean;
  ChainNode: { id: number; url: string; name: string };
  origin: string;
};
