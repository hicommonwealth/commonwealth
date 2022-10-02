import { IAnyListener } from "../../src";
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import {RegisteredTypes} from "@polkadot/types/types";

export type IListenerInstances = { [key: string]: IAnyListener }

export type ChainAttributes = {
  id: string;
  base: ChainBase;
  network: ChainNetwork;
  substrate_spec: RegisteredTypes;
  contract_address: string;
  verbose_logging: boolean;
  ChainNode: { id: number, url: string}
}
