import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import Sequelize from 'sequelize';
import { sequelize } from '../../database';
import Errors from './errors';

const Op = Sequelize.Op;

export default async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body['subscription_ids[]'] || !req.body['delivery_mechanism_type']) {
    return next(new AppError(Errors.NoSubscriptionIdOrDeliveryMechanismType));
  }

  let idOptions;
  if (typeof req.body['subscription_ids[]'] === 'string') {
    idOptions = { [Op.eq]: +req.body['subscription_ids[]'] };
  } else {
    idOptions = { [Op.in]: req.body['subscription_ids[]'].map((n) => +n) };
  }

  const subscriptions = await models.Subscription.findAll({
    where: { id: idOptions },
  });

  if (subscriptions.find((s) => s.subscriber_id !== req.user.id)) {
    return next(new AppError(Errors.NotUsersSubscription));
  }

  const userDeliveryMechanism = await models.DeliveryMechanism.findOne({
    where: {
      user_id: req.user.id,
      type: req.body.delivery_mechanism_type,
    },
  });

  if (!userDeliveryMechanism) {
    return next(new AppError(Errors.NoDeliveryMechanismFound));
  }

  let notModified = false;
  await sequelize.transaction(async (t) => {
    await Promise.all(
      subscriptions.map(async (s) => {
        // Check if SubscriptionDelivery already exists
        const existingSubscriptionDelivery =
          await models.SubscriptionDelivery.findOne({
            where: {
              subscription_id: s.id,
              delivery_mechanism_id: userDeliveryMechanism.id,
            },
          });

        if (existingSubscriptionDelivery) {
          notModified = true;
          return;
        }

        // If no existing SubscriptionDelivery, create a new one
        return models.SubscriptionDelivery.create(
          {
            subscription_id: s.id,
            delivery_mechanism_id: userDeliveryMechanism.id,
          },
          { transaction: t }
        );
      })
    );
  });

  if (notModified) {
    return res.status(304).send();
  } else {
    return res.json({ status: 'Success', result: 'Enabled Delivery Option' });
  }
};
