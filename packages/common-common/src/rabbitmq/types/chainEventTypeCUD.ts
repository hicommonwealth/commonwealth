import type { RmqMsgNamespace } from './index';
import { RmqMsgFormatError } from './index';

interface IRmqMsgCreateCETypeCUD {
  chainEventTypeId: string;
  cud: 'create';
}

export const RmqCETypeCUD: RmqMsgNamespace<IRmqMsgCreateCETypeCUD> = {
  getInvalidFormatError(chainEventType: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following chain-event-type is improperly formatted: ${JSON.stringify(
        chainEventType
      )}`
    );
  },

  isValidMsgFormat(data: any): data is IRmqMsgCreateCETypeCUD {
    return !!(
      data.chainEventTypeId &&
      typeof data.chainEventTypeId === 'string' &&
      data.cud === 'create'
    );
  },

  checkMsgFormat(data: any): void {
    const valid = this.isValidMsgFormat(data);
    if (!valid) {
      console.log(
        `The following chain-event-type is improperly formatted: ${JSON.stringify(
          data
        )}`
      );
      throw this.getInvalidFormatError(data);
    }
  },
};

export namespace RmqCETypeCUD {
  export type RmqMsgType = IRmqMsgCreateCETypeCUD;
}
