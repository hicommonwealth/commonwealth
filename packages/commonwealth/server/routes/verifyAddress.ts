import { User } from '@hicommonwealth/core';
import {
  verifyAddress as verifyAddressService,
  type DB,
} from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { MixpanelLoginEvent } from '../../shared/analytics/types';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';

// TODO: refactor to libs/model command
const verifyAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community_id, address, wallet_id, session } = req.body;
  await verifyAddressService(
    community_id,
    address,
    wallet_id,
    session,
    req.user as User,
  );

  if (req.user) {
    // if user was already logged in, we're done
    return res.json({
      status: 'Success',
      result: { address, message: 'Verified signature' },
    });
  } else {
    // if user isn't logged in, log them in now
    const newAddress = await models.Address.findOne({
      where: { community_id, address },
    });
    const user = await models.User.scope('withPrivateData').findOne({
      // @ts-expect-error StrictNullChecks
      where: { id: newAddress.user_id },
    });
    req.login(user, (err) => {
      const serverAnalyticsController = new ServerAnalyticsController();
      if (err) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        serverAnalyticsController.track(
          {
            event: MixpanelLoginEvent.LOGIN_FAILED,
          },
          req,
        );
        return next(err);
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      serverAnalyticsController.track(
        {
          event: MixpanelLoginEvent.LOGIN_COMPLETED,
          userId: user.id,
        },
        req,
      );

      return res.json({
        status: 'Success',
        result: {
          user,
          address,
          message: 'Signed in',
        },
      });
    });
  }
};

export default verifyAddress;
