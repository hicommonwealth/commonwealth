import { trpc } from '@hicommonwealth/adapters';
import { Wallet } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  CreateWallet: trpc.command(Wallet.CreateWallet, trpc.Tag.Wallet),
  SendTransaction: trpc.command(Wallet.SendTransaction, trpc.Tag.Wallet),
});
