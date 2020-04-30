import { Response, NextFunction } from 'express';
import request from 'superagent';
import { SLACK_FEEDBACK_WEBHOOK } from '../config';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const sendFeedback = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.body.text) {
    return next(new Error('Nothing sent!'));
  }

  const userText =
    !req.user ? '<Anonymous>' :
    req.user.email ? req.user.email :
    `<User ${req.user.id}>`;

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
