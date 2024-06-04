import { DB } from '@hicommonwealth/model';
import BanCache from 'server/util/banCheckCache';
import {
  CreateWalletOptions,
  CreateWalletResult,
  __createWallet,
} from './server_wallet_methods/create_wallet';

export class ServerWalletController {
  constructor(public models: DB, public banCache: BanCache) {}

  async createWallet(
    options: CreateWalletOptions,
  ): Promise<CreateWalletResult> {
    return __createWallet.call(this, options);
  }
}
