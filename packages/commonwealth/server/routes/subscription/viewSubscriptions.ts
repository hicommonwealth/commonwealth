import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

const combineResults = (subWithThread, subWithComment) => {
  const resultMap = new Map();

  subWithThread.forEach((s) => {
    resultMap.set(s.id, s.toJSON());
  });

  subWithComment.forEach((s) => {
    resultMap.set(s.id, { ...resultMap.get(s.id), ...s.toJSON() });
  });

  return Array.from(resultMap.values());
};

export default async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const user_id = req.user.id;

  const associationThreads: any = [
    {
      model: models.Thread,
      as: 'Thread',
      include: [
        {
          model: models.Address,
          as: 'Address',
        },
      ],
      attributes: {
        exclude: ['version_history', 'body', 'plaintext'],
      },
    },
  ];

  const associationCommentsChain: any = [
    {
      model: models.Comment,
      as: 'Comment',
      include: [models.Address],
      attributes: {
        exclude: ['version_history', '_search'],
      },
    },
    {
      model: models.Chain,
      as: 'Chain',
      required: false,
      where: { active: true },
    },
  ];

  const searchParams: any = { subscriber_id: user_id };

  const [subWithThread, subWithComment] = await Promise.all([
    models.Subscription.findAll({
      where: searchParams,
      include: associationThreads,
    }),
    models.Subscription.findAll({
      attributes: ['id'],
      where: searchParams,
      include: associationCommentsChain,
    }),
  ]);

  const subscriptions = combineResults(subWithThread, subWithComment);

  return res.json({
    status: 'Success',
    result: subscriptions,
  });
};
