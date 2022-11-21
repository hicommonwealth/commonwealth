import {RmqMsgFormatError, RmqMsgNamespace} from "./index";


interface IRmqMsgCreateEntityCUD {
  ce_id: number;
  chain_id: string;
  cud: 'create';
}

export const RmqEntityCUD: RmqMsgNamespace<IRmqMsgCreateEntityCUD> = {
  getInvalidFormatError(entity: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following entity is improperly formatted: ${JSON.stringify(entity)}`
    )
  },

  isValidMsgFormat(data: any): data is IRmqMsgCreateEntityCUD {
    return !!(
      typeof data.ce_id === 'number'
      && data.chain_id && typeof data.chain_id === 'string'
      && data.cud === 'create'
    );
  },

  checkMsgFormat(data: any): void {
    const valid = this.isValidMsgFormat(data);
    if (!valid) {
      console.log(`The following entity is improperly formatted: ${JSON.stringify(data)}`);
      throw this.getInvalidFormatError(data);
    }
  }
}

export namespace RmqEntityCUD {
  export type RmqMsgType = IRmqMsgCreateEntityCUD
}
