/* eslint-disable guard-for-in */
//import Sequelize from 'sequelize';
const Sequelize = require("sequelize");
import BN from 'bn.js';
// import _ from 'lodash';
import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors } from './getOffences';


const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

interface IEventData {
  kind?: string;
  amount: string;
  validator: string;
}

const getRewards = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash_id } = req.query;
  let { startDate, endDate } = req.query;
  let validators = {};


  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  let eraLengthInHours;
  if (chain === 'edgeware') {
    eraLengthInHours = 6;
  } else if (chain === 'kusama') {
    eraLengthInHours = 6;
  }

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }

  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    endDate = new Date();
    startDate = new Date();
    endDate = endDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // today's date
    startDate.setDate(startDate.getDate() - 30);
    startDate = startDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // 30 days ago date
  }

  // get rewards of last N days in descending order
  const rewards = await models.ChainEvent.findAll({
    where: {
      '$ChainEventType.chain$': chain,
      '$ChainEventType.event_name$': 'reward',
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [
      ['created_at', 'DESC']
    ],
    include: [
      { model: models.ChainEventType }
    ]
  });


// there was no reward found in db
if (!rewards.length) return res.json({status: 'Success',result: {validators: validators || []}});

if (chain === 'edgeware') {
  // there is no validator identifier in reward event in chain-event, 
  // get the sessions from chain-event and link rewards event to session
  // and assign it to all the validators in the session event.

  // get sessions of last N days in descending order
  const sessions = await models.ChainEvent.findAll({
    where: {
      '$ChainEventType.chain$': chain,
      '$ChainEventType.event_name$': 'new-session',
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [
      ['created_at', 'DESC']
    ],
    include: [
      { model: models.ChainEventType }
    ]
  });

  // there was no session or reward found in db
  if (!sessions.length) return res.json({status: 'Success',result: {validators: validators || []}});


  // if number of sessions are more then number of rewards drop last session as the reward for that session is not yet issued.
  if(sessions.length > rewards.length){ sessions.splice(0,1);}

  
  // iterate over sessions
    validators = sessions.map(function(session, index) {
      let response = {};
      let reward = rewards[index];
      // get reward data
      const rew_event_data: IEventData = reward.dataValues.event_data;

      // get blockNumber and active validators of the session
      const blockNumber =  reward.dataValues.block_number;
      const activeValidators = session.dataValues.event_data.data.active;

      // assign rewards to all the validator of the session
      activeValidators.forEach((validator_stash_id) => {
        if (!validators.hasOwnProperty(validator_stash_id)){
          response[validator_stash_id] = {}
        }
        response[validator_stash_id][blockNumber] = rew_event_data.amount;
      });
      return response;
  });
  validators = validators[0];
 } 
 // for kusama
else if (chain === 'kusama') {
  rewards.forEach((reward) => {
    const event_data: IEventData = reward.dataValues.event_data;
    const key = event_data.validator || chain;
    if (!validators.hasOwnProperty(key)) { validators[key] = {};}  
    validators[key][reward['block_number']] = reward['amount'];
   });
 }


if(stash_id){
  if(validators.hasOwnProperty(stash_id)){validators = {stash_id: validators[stash_id]};}
  else{validators = {};}
} 

return res.json({status: 'Success',result: {validators: validators || []}});

};

export default getRewards;
