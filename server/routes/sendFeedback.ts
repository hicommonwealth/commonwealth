import { Request, Response, NextFunction } from 'express';
import request from 'superagent';
import { SLACK_FEEDBACK_WEBHOOK } from '../config';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotSent: 'Nothing sent!'
};

const sendFeedback = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.text) {
    return next(new Error(Errors.NotSent));
  }

  const userText = !req.user ? '<Anonymous>'
    : req.user.email ? req.user.email
      : `<User ${req.user.id}>`;

  const urlText = req.body.url || '<Unknown URL>';

  const data = JSON.stringify({ text: userText + ' @ ' + urlText + ': \n' + req.body.text });
  request
    .post(SLACK_FEEDBACK_WEBHOOK)
    .send(data)
    .end((err, res2) => {
      if (err) {
        // TODO: handle 401 unauthorized
        return next(new Error(err));
      }
      return res.json({ status: 'Success' });
    });
};

export default sendFeedback;
