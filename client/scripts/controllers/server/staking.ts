import app from 'state';
import { get } from 'lib/util';

class StakingController {
  public offences(callback) {
    return get('/getOffences', { chain: app.chain.id, jwt: app.login.jwt }, callback);
  }
}

export default StakingController;
