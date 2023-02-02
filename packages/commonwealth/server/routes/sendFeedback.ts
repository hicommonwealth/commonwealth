import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import request from 'superagent';
import { SLACK_FEEDBACK_WEBHOOK } from '../config';
import type { DB } from '../models';

export const Errors = {
  NotSent: 'Nothing sent!',
};

const sendFeedback = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.text) {
    return next(new AppError(Errors.NotSent));
  }

  const userText = !req.user
    ? '<Anonymous>'
    : req.user.email
    ? req.user.email
    : `<User ${req.user.id}>`;

  const urlText = req.body.url || '<Unknown URL>';

  const data = JSON.stringify({
    text: `${userText} @ ${urlText}:\n${req.body.text}`,
  });
  request
    .post(SLACK_FEEDBACK_WEBHOOK)
    .send(data)
    .end((err) => {
      if (err) {
        // TODO: handle 401 unauthorized
        return next(new ServerError(err));
      }
      return res.json({ status: 'Success' });
    });
};

export default sendFeedback;
