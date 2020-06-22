/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get } from 'lib/util';

class ChainEventsController {
  public constructor() {
    // do nothing
  }

  public offences(callback) {
    return get('/getOffences', { chain: app.chain.id, jwt: app.login.jwt }, callback);
  }
}

export default ChainEventsController;
