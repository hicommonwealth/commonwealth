/* eslint-disable guard-for-in */
import BN from 'bn.js';
// import _ from 'lodash';
import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors } from './getOffences';
const Sequelize = require('sequelize');
import { sequelize } from './../database'



const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

interface IEventData {
  kind?: string;
  amount: string;
  validator: string;
}

const getRewards = async (models, req: Request, res: Response, next: NextFunction, calledFromServer?: boolean) => {
  const { chain, stash } = req.query;
  const { startDate, endDate } = req.query;
  let { version } = req.query;
  version = Number(version);
  // variables
  let validators: { [key: string]: { [block: string]: any } } = {};
  let rewards;
  let session_rewards;

  if (!chain) { return next(new Error(Errors.ChainIdNotFound)); }

  // set default version value for edgeware chain 
  if (chain === 'edgeware' && !version) { version = 31; }

  const chainInfo = await models.Chain.findOne({ where: { id: chain } });


  // if we are using old version of chain
  if (chain === 'edgeware' && version === 31) {

    // there is no validator identifier in reward event in chain-event for old version,
    // get the sessions and rewards over specified time from chain-event and 
    // join session event with rewards
    // if a stash id is provided then filter out just the session having provided
    // stash id
    let rawQuery = `
      SELECT *
      FROM(
        SELECT block_number  as "session_block_number", event_data as "session_event_data", row_number()
        OVER (ORDER BY created_at DESC) AS "rn"
        FROM "ChainEvents" ce
        WHERE chain_event_type_id  = '${chain}-new-session' AND created_at BETWEEN '${startDate}' AND '${endDate}'
      ) newSession
      JOIN (
        SELECT block_number  as "reward_block_number", event_data as "reward_event_data", row_number()
        OVER (ORDER BY created_at DESC) AS "rn"
        FROM "ChainEvents" ce
        WHERE chain_event_type_id  = '${chain}-reward' AND created_at BETWEEN '${startDate}' AND '${endDate}'
      ) reward
        ON reward.rn = newSession.rn`

    if (stash) {
      rawQuery += ` where newSession.session_event_data -> 'data' ->> 'active' LIKE '%${stash}%'`;
    }

    session_rewards = await sequelize.query(rawQuery, {});
    session_rewards = session_rewards[0] //fetch the results

    // if no session/reward found 
    if (session_rewards.length === 0) {
      return res.json({ status: 'Success', result: validators || {} });
    }


    session_rewards.forEach((s_r) => {
      const reward_event_data: IEventData = s_r.reward_event_data;
      const block_number = s_r.reward_block_number;
      const session_validators = s_r.session_event_data.data.active;
      session_validators.forEach((validator_id) => {
        if (!Object.prototype.hasOwnProperty.call(validators, validator_id)) {
          validators[validator_id] = {};
        }
        validators[validator_id][block_number] = reward_event_data['amount'];
      });
    });

    if (stash) {
      validators = { stash_id: validators[stash] }
    }
  }
  else if (chain === 'kusama' || (chain === 'edgeware' && version === 38)) {
    // if using kusama chain or new version of edgeware

    // basic query to fetch rewards from chain-event
    let reward_query = {
      where: {
        '$ChainEventType.chain$': chain,
        '$ChainEventType.event_name$': 'reward',
        created_at: { [Op.between]: [startDate, endDate] },
      },
      order: [['created_at', 'DESC']],
      include: [{ model: models.ChainEventType }]
    };

    if (stash) {
      let qry = { [Op.and]: Sequelize.literal(`event_data->>'validator'='${stash}'`) };
      reward_query['where'] = Object.assign(reward_query['where'], qry);
    }
    // get rewards for the user(s)
    rewards = await models.ChainEvent.findAll(reward_query);

    rewards.forEach((reward) => {
      const event_data: IEventData = reward.dataValues.event_data;
      const block_number = reward.dataValues.block_number;

      const validator_id = event_data.validator || chain;
      if (!Object.prototype.hasOwnProperty.call(validators, validator_id)) {
        validators[validator_id] = {};
      }
      validators[validator_id][block_number] = event_data['amount'];
    });
  }
  if (calledFromServer) return { status: 'Success', result: validators || {}, denom: 'EDG' };
  else return res.json({ status: 'Success', result: validators || {}, denom: 'EDG' });

};

export default getRewards;
