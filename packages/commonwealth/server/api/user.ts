import { trpc } from '@hicommonwealth/adapters';
import { User } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  updateUser: trpc.command(User.UpdateUser, trpc.Tag.User),
  getNewContent: trpc.query(User.GetNewContent, trpc.Tag.User),
  createApiKey: trpc.command(User.CreateApiKey, trpc.Tag.User),
});
