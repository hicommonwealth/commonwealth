export type TRmqMsgCETypeCUD = IRmqMsgCreateCETypeCUD;

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
