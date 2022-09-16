export type TRmqMsgCETypeCUD = IRmqMsgCreateCETypeCUD;

export function isTRmqMsgCETypeCUD(data: any): data is TRmqMsgCETypeCUD {
  return IRmqMsgCreateCETypeCUD(data);
}

export interface IRmqMsgCreateCETypeCUD {
  chainEventTypeId: string;
  cud: 'create';
}

export function IRmqMsgCreateCETypeCUD(data: any): data is IRmqMsgCreateCETypeCUD {
  return (
    data.chainEventTypeId && typeof data.chainEventTypeId === 'string'
    && data.cud === 'create'
  );
}
