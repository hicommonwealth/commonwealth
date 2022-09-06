export type TRmqMsgCETypeCUD = IRmqMsgCreateCETypeCUD;

export interface IRmqMsgCreateCETypeCUD {
  chainEventTypeId: number;
  cud: 'create';
}

export function IRmqMsgCreateCETypeCUD(data: any): data is IRmqMsgCreateCETypeCUD {
  return (
    typeof data.chainEventTypeId === 'number'
    && data.cud === 'create'
  );
}
