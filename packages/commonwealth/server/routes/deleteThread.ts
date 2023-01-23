import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type BanCache from '../util/banCheckCache';
import deleteThreadFromDb from '../util/deleteThread';
import validateRoles from '../util/validateRoles';

enum DeleteThreadErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoPermission = 'Not owned by this user',
}

type DeleteThreadReq = {
  thread_id: number;
  chain_id;
  canvas_action;
  canvas_session;
  canvas_hash;
};

type DeleteThreadResp = Record<string, never>;

const deleteThread = async (
  models: DB,
  banCache: BanCache,
  req: TypedRequestBody<DeleteThreadReq>,
  resp: TypedResponse<DeleteThreadResp>
) => {
  const { thread_id } = req.body;
  if (!req.user) {
    throw new AppError(DeleteThreadErrors.NoUser);
  }
  if (!thread_id) {
    throw new AppError(DeleteThreadErrors.NoThread);
  }
  const thread = await models.Thread.findOne({
    where: {
      id: thread_id,
    },
    include: [{ model: models.Address, as: 'Address' }],
  });
  if (!thread) {
    throw new AppError(DeleteThreadErrors.NoThread);
  }

  // permit author to delete if not banned
  if (thread.Address.user_id === req.user.id) {
    const [canInteract, banError] = await banCache.checkBan({
      chain: thread.chain,
      address: thread.Address.address,
    });
    if (!canInteract) {
      throw new AppError(banError);
    }
    await deleteThreadFromDb(models, thread_id);
    return success(resp, {});
  }

  // permit community mod or admin to delete
  const isAdminOrMod = await validateRoles(
    models,
    req.user,
    'moderator',
    thread.chain
  );
  if (!isAdminOrMod) {
    throw new AppError(DeleteThreadErrors.NoPermission);
  }
  await deleteThreadFromDb(models, thread_id);
  return success(resp, {});
};

export default deleteThread;
