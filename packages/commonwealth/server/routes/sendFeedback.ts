import { Request, Response, NextFunction } from 'express';
import request from 'superagent';
import { SLACK_FEEDBACK_WEBHOOK } from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotSent: 'Nothing sent!'
};

const sendFeedback = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.text) {
    return next(new AppError(Errors.NotSent));
  }

  const userText = !req.user ? '<Anonymous>'
    : req.user.email ? req.user.email
      : `<User ${req.user.id}>`;

  const urlText = req.body.url || '<Unknown URL>';

  const data = JSON.stringify({ text: `${userText} @ ${urlText}:\n${req.body.text}` });
  request
    .post(SLACK_FEEDBACK_WEBHOOK)
    .send(data)
    .end((err, res2) => {
      if (err) {
        // TODO: handle 401 unauthorized
        return next(new AppError(err));
      }
      return res.json({ status: 'Success' });
    });
};

export default sendFeedback;
