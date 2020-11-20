import request from 'superagent';

import { blake2AsHex } from '@polkadot/util-crypto';
import { u8aConcat, stringToU8a, compactAddLength } from '@polkadot/util';
import { Request, Response, NextFunction } from 'express';

export const hashTwo = (left: string, right: string) => {
  return blake2AsHex(
    u8aConcat(
      compactAddLength(stringToU8a(left)),
      compactAddLength(stringToU8a(right))
    )
  );
};

const createGist = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.identityType) {
    return res.status(400).json({ error: 'No identityType provided' });
  }
  if (!req.body.identity) {
    return res.status(400).json({ error: 'No identity provided' });
  }
  if (!req.body.sender) {
    return res.status(400).json({ error: 'No sender provided' });
  }
  if (!req.body.description) {
    return res.status(400).json({ error: 'No description provided' });
  }
  const socialAccount = await models.SocialAccount.findOne({ where: { provider: 'github', user_id: req.user.id } });
  if (!socialAccount) {
    return next(new Error('No linked Github account'));
  }

  const identityHash = hashTwo(req.body.identityType, req.body.identity);
  const totalHash = hashTwo(req.body.sender, identityHash);

  const gistData = {
    public: true,
    description: 'Edgeware Identity Attestation',
    files: { proof: { content: `Attesting to my edgeware account: II ${totalHash} II` } },
  };

  const githubAccessToken = socialAccount.access_token;
  request
    .post('https://api.github.com/gists')
    .set('Authorization', `token ${githubAccessToken}`)
    .send(gistData)
    .end((err, res2) => {
      if (err) {
        // TODO: handle 401 unauthorized
        return next(new Error(err));
      }
      return res.json({ status: 'Success', response: res2.body });
    });
};

export default createGist;
