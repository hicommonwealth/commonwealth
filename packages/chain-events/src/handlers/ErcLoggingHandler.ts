import type { ChainNetwork } from 'common-common/src/types';

import type { CWEvent } from '../interfaces';
import { IEventHandler } from '../interfaces';
import { addPrefix, factory } from '../logging';

export class ErcLoggingHandler extends IEventHandler {
  private logger = {};
  constructor(public network: ChainNetwork, public tokenAddresses: string[]) {
    super();
  }
  public async handle(event: CWEvent): Promise<undefined> {
    if (this.tokenAddresses.includes(event.contractAddress)) {
      // if logger for this specific token doesn't exist, create it - decreases computational cost of logging
      if (!this.logger[event.contractAddress])
        this.logger[event.contractAddress] = factory.getLogger(
          addPrefix(__filename, [
            `Erc${this.network.slice(3)}`,
            event.contractAddress,
          ])
        );

      this.logger[event.contractAddress].info(
        `Received event: ${JSON.stringify(event, null, 2)}`
      );
    }
    return null;
  }
}
