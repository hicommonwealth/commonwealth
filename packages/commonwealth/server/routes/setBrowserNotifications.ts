import { success, TypedRequestBody, TypedResponse } from '../types';
import { AppError } from '../util/errors';

const Errors = {
  NoUserMatch: 'No user found with that ID',
  NoValueProvided: 'Must provide a value',
  Failure: 'Could not update user',
};

type setBrowserNotificationsReq = { enabled: boolean };
type setBrowserNotificationsResp = { message: string };

const setBrowserNotifications = async (
  models,
  req: TypedRequestBody<setBrowserNotificationsReq>,
  res: TypedResponse<setBrowserNotificationsResp>
) => {
  const { enabled } = req.body;

  if (!enabled) {
    return new AppError(Errors.NoValueProvided);
  }
  const user = await models.User.findOne({ where: { id: req.user.id } });
  if (!user) {
    return new AppError(Errors.NoUserMatch);
  }

  try {
    user.browser_notifications_enabled = enabled;
    user.save();
  } catch (e) {
    return new AppError(Errors.Failure);
  }
  return success(res, { message: 'Updated user' });
};

export default setBrowserNotifications;
