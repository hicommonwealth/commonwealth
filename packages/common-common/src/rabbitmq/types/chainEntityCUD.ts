export type TRmqMsgEntityCUD = IRmqMsgCreateEntityCUD;

export function isTRmqMsgEntityCUD(data: any): data is TRmqMsgEntityCUD {
  return isRmqMsgCreateEntityCUD(data);
}

export interface IRmqMsgCreateEntityCUD {
  ce_id: number;
  chain_id: string;
  cud: 'create';
}

export function isRmqMsgCreateEntityCUD(data: any): data is IRmqMsgCreateEntityCUD {
  return (
    typeof data.ce_id === 'number'
    && data.chain_id && typeof data.chain_id === 'string'
    && data.cud === 'create'
  );
}
