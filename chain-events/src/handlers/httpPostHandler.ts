import fetch from 'node-fetch';

import { CWEvent, IEventHandler } from '../interfaces';
import { addPrefix, factory } from '../logging';

export class httpPostHandler implements IEventHandler {
  public readonly url;

  constructor(url) {
    this.url = url;
  }

  public async handle(event: CWEvent): Promise<any> {
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );

    try {
      const res = await fetch(this.url, {
        method: 'POST',
        body: JSON.stringify(event),
        headers: { 'Content-Type': 'application/json' },
      });

      // throw if there is an error
      log.info(`Post request status code: ${res.status}`);
      if (!res.ok) throw res;

      // log post request response
      log.info(await res.json());
    } catch (error) {
      log.error(`Error posting event ${event} to ${this.url}`);
      // log error info returned by the server if any
      log.error(await error.text());
    }
  }
}
