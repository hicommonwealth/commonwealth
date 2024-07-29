import { trpc } from '@hicommonwealth/adapters';
import { User } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  updateUser: trpc.command(User.UpdateUser, trpc.Tag.User),
});
