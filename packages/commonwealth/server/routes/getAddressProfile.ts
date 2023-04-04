import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import _ from 'lodash';
import { failure } from '../types';
import type { TypedRequestBody, TypedResponse } from '../types';
import type { DB } from '../models';
import { paginationValidation } from '../util/helperValidations';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  InvalidAddress: 'Invalid address',
};

export const getCommentsValidation = [
  query('community_id').isString().trim(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

export type GetAddressProfileReq = {
  addresses: string[];
  chain: string;
};

type GetAddressProfileResp = {
  profileId: number;
  name: string;
  address: string;
  lastActive: Date;
  avatarUrl: string;
};

const getAddressProfile = async (
  models: DB,
  req: TypedRequestBody<GetAddressProfileReq>,
  res: TypedResponse<GetAddressProfileResp>,
  next: NextFunction
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  // single profile
  if (
    (req.body as GetAddressProfileReq).addresses &&
    (req.body as GetAddressProfileReq).chain
  ) {
    const reqChain = (req.body as GetAddressProfileReq).chain;
    const reqAddr = (req.body as GetAddressProfileReq).addresses;

    const chain = await models.Chain.findOne({
      where: { id: reqChain },
    });
    if (!chain) {
      return next(new AppError(Errors.InvalidChain));
    }

    const address = await models.Address.findOne({
      where: {
        chain: reqChain,
        address: reqAddr,
      },
      include: [models.Profile],
    });

    if (!address) {
      return next(new AppError(Errors.InvalidAddress));
    }

    const profile = await address.getProfile();

    return res.json({
      status: 'Success',
      result: {
        profileId: address.profile_id,
        name: profile?.profile_name,
        address: address.address,
        lastActive: address.last_active,
        avatarUrl: profile?.avatar_url,
      },
    });
  }

  // multiple profiles
  if (req.body['address[]'] && req.body['chain[]']) {
    const addrs = req.body['address[]'];
    const chains = req.body['chain[]'];
    let addrObjs;

    // if all profiles are on the same chain, make a fast query, otherwise, make multiple queries
    if (_.uniq(chains).length === 1) {
      addrObjs = await models.Address.findAll({
        where: {
          chain: chains[0],
          address: addrs,
        },
        include: [models.Profile],
      });
    } else {
      let query;
      addrObjs = [];
      for (const chain in chains) {
        if (chains[chain]) {
          query = await models.Address.findAll({
            where: {
              chain: chains[chain],
              address: addrs,
            },
            include: [models.Profile],
          });
          addrObjs.push(query);
        }
      }
      addrObjs = addrObjs.flat();
    }

    const profiles = await Promise.all(
      addrObjs.map((addr) => addr.getProfile())
    );

    return res.json({
      status: 'Success',
      result: profiles.map((profile, i) => {
        return {
          profileId: addrObjs[i].profile_id,
          name: profile?.profile_name,
          address: addrObjs[i].address,
          lastActive: addrObjs[i].last_active,
          avatarUrl: profile?.avatar_url,
        };
      }),
    });
  }
};

export default getAddressProfile;
