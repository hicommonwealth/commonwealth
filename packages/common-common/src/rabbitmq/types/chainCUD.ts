import {ChainBase, ChainNetwork} from "../../types";
import {RegisteredTypes} from "@polkadot/types/types";

export type TRmqMsgChainCUD = IRmqMsgCreateChainCUD | IRmqMsgDeleteChainCUD | IRmqMsgUpdateChainCUD;

export interface IRmqMsgDeleteChainCUD {
  chain_id: string;
  cud: 'delete-chain';
}

export function isRmqMsgDeleteChainCUD(data: any): data is IRmqMsgDeleteChainCUD {
  return (data.chain_id && typeof data.chain_id === 'string' && data.cud === 'delete-chain')
}

export interface IRmqMsgCreateChainCUD {
  chain_id: string;
  base: ChainBase;
  network: ChainNetwork;
  verbose_logging: boolean;
  active: boolean;
  chain_node_url: string;

  contract_address?: string;
  substrate_spec?: RegisteredTypes;

  cud: 'create-chain';
}

export function isRmqMsgCreateChainCUD(data: any): data is IRmqMsgCreateChainCUD {
  return (
    data.chain_id && typeof data.chain_id === 'string'
    && Object.values(ChainBase).includes(data.base)
    && Object.values(ChainNetwork).includes(data.network)
    && typeof data.chain_node_id === "number"
    && typeof data.verbose_logging === 'boolean'
    && typeof data.active === 'boolean'
    && data.chain_node_url && typeof data.chain_node_url === 'string'
    && data.cud === 'create-chain'
  );
}

export interface IRmqMsgUpdateChainCUD {
  chain_id: string;
  base: ChainBase;
  network: ChainNetwork;
  verbose_logging: boolean;
  active: boolean;
  chain_node_url: string;

  contract_address?: string;
  substrate_spec?: RegisteredTypes;

  cud: 'update-chain'
}

export function isRmqMsgUpdateChainCUD(data: any): data is IRmqMsgUpdateChainCUD {
  return (
    data.chain_id && typeof data.chain_id === 'string'
    && Object.values(ChainBase).includes(data.base)
    && Object.values(ChainNetwork).includes(data.network)
    && typeof data.chain_node_id === "number"
    && typeof data.verbose_logging === 'boolean'
    && typeof data.active === 'boolean'
    && data.chain_node_url && typeof data.chain_node_url === 'string'
    && data.cud === 'update-chain'
  );
}
