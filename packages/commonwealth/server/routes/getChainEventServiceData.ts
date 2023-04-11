import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { CHAIN_EVENT_SERVICE_SECRET } from '../config';
import type { DB } from '../models';

export const Errors = {
  NeedSecret: 'Must provide the secret to use this route',
  InvalidSecret: 'Must provide a valid secret to use this route',
  NoNumChainSubscribers: 'Must provide the number of chain-event subscribers',
  NoChainSubscriberIndex:
    'Must provide the index of the chain-event subscriber',
};

export const getChainEventServiceData = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.secret) {
    return next(new AppError(Errors.NeedSecret));
  }

  if (req.body.secret !== CHAIN_EVENT_SERVICE_SECRET) {
    return next(new AppError(Errors.InvalidSecret));
  }

  if (isNaN(req.body.num_chain_subscribers)) {
    return next(new AppError(Errors.NoNumChainSubscribers));
  }

  if (isNaN(req.body.chain_subscriber_index)) {
    return next(new AppError(Errors.NoChainSubscriberIndex));
  }

  const numChainSubs = req.body.num_chain_subscribers;
  const chainSubIndex = req.body.chain_subscriber_index;

  const query = `
      WITH allChains AS (SELECT "Chains".id,
                                "Chains".substrate_spec,
                                "Chains".network,
                                "Chains".base,
                                "Chains".ce_verbose,
                                "ChainNodes".id                          as chain_node_id,
                                "ChainNodes".private_url,
                                "ChainNodes".url,
                                "Contracts".address,
                                ROW_NUMBER() OVER (ORDER BY "Chains".id) AS index
                         FROM "Chains"
                                  JOIN "ChainNodes" ON "Chains".chain_node_id = "ChainNodes".id
                                  LEFT JOIN "CommunityContracts" cc
                                            ON cc.chain_id = "Chains".id
                                  LEFT JOIN "Contracts"
                                            ON "Contracts".id = cc.contract_id
                         WHERE "Chains"."has_chain_events_listener" = true
                           AND ("Contracts".type IN ('marlin-testnet', 'aave', 'compound') OR
                                ("Chains".base = 'substrate' AND "Chains".type = 'chain') OR
                                ("Chains".base = 'cosmos' AND ("Chains".type='token' OR "Chains".type='chain'))))
      SELECT allChains.id,
             allChains.substrate_spec,
             allChains.address                                                 as contract_address,
             allChains.network,
             allChains.base,
             allChains.ce_verbose                                              as verbose_logging,
             JSON_BUILD_OBJECT('id', allChains.chain_node_id, 'url',
                               COALESCE(allChains.private_url, allChains.url)) as "ChainNode"
      FROM allChains
      WHERE MOD(allChains.index, ${numChainSubs}) = ${chainSubIndex};
  `;

  const result = await models.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });

  return res.json({ status: 'Success', result });
};
