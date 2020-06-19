import app from 'state';
import { get } from './chain_entities';

class StakingController {
  public static offences(callback) {
    return get('/getOffences', { chain: app.chain.id }, callback);
  }
}

export default StakingController;
