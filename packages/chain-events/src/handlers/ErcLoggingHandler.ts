import { CWEvent, IEventHandler } from "../interfaces";
import { ChainNetwork } from 'common-common/src/types';
import { addPrefix, factory } from "../logging";


export class ErcLoggingHandler extends IEventHandler {
  private logger = {}
  constructor(public network: ChainNetwork, public tokenNames: string[]) {
    super();
  }
  public async handle(event: CWEvent): Promise<undefined> {
    if (this.tokenNames.includes(event.chain)) {
      // if logger for this specific token doesn't exist, create it - decreases computational cost of logging
      if (!this.logger[event.chain])
        this.logger[event.chain] =
          factory.getLogger(addPrefix(__filename, [`Erc${this.network.slice(3)}`, event.chain]));

      this.logger[event.chain].info(`Received event: ${JSON.stringify(event, null, 2)}`);
    }
    return null;
  }
}
