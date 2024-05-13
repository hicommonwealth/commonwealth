import { AppError, ServerError } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import request from 'superagent';
import { fileURLToPath } from 'url';
import { SLACK_FEEDBACK_WEBHOOK } from '../config';

export const Errors = {
  NotSent: 'Please enter the feedback message.',
  SlackWebhookError: 'SLACK_FEEDBACK_WEBHOOK missing.',
};

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const sendFeedback = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.text) {
    return next(new AppError(Errors.NotSent));
  }

  if (!SLACK_FEEDBACK_WEBHOOK) {
    log.error('No slack webhook found');
    return next(new ServerError(Errors.SlackWebhookError));
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
