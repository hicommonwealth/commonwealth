import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import Sequelize from 'sequelize';
import {sequelize} from './../database'
const Op = Sequelize.Op;

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
    * Event handler for reward information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData > ,dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Reward) {
      return dbEvent;
    }

    // 2) check for the new-session event data from chain events db
    const chainEventNewSession = await this._models.ChainEvent.findOne({
      include: [
        { 
          model: this._models.ChainEventType,
          where: {
            chain: this._chain,
            event_name: event.data.kind,
          }
        }
      ],
      order: [
        ['created_at', 'DESC']
      ],
      attributes: ['event_data']
    });

    if (!chainEventNewSession) { // Ignore unknown event types, if any.
      return dbEvent;
    }

    const newRewardEventData = event.data;
    const newSessionEventData = chainEventNewSession.event_data.data;

    // WHERE stash IN ('${Object.keys(newSessionEventData.activeExposures).join("','")}') and eventType = '${newRewardEventData.kind}'
    const rawQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY stash ORDER BY created_at DESC) 
        FROM public."HistoricalValidatorStatistic" 
        WHERE stash IN ('${Object.keys(newSessionEventData.activeExposures).join("','")}')
      ) as q
      WHERE row_number = 1
    ` 
    const [validators, metadata] = await sequelize.query(rawQuery);
    let validatorsList = JSON.parse(JSON.stringify(validators));
  
    // 3) Modify new exposures for validators
    validatorsList.forEach((validator: any) => {
      let newExposure = newSessionEventData.activeExposures[validator.stash];
      newExposure.own = (Number(newExposure.own) + Number(newRewardEventData.amount)).toString(); // This will be modified as per new criteria or information.
      
      validator.exposure = newExposure;
      validator.block = event.blockNumber;
      validator.eventType = newRewardEventData.kind;
      validator.commissionPer = newSessionEventData.commissionPer;
      validator.eraPoints = newSessionEventData.eraPoints;
      validator.apr = apr;
      validator.isOnline =  true,
      validator.isElected = true;
      validator.toBeElected = false;
      validator.hasMessage = false;
      validator.created_at = new Date().toISOString();
      validator.updated_at = new Date().toISOString();
      delete validator.id;
      delete validator.row_number;
    });

    const existingValidators = new Set(validatorsList.map((validator) => validator.stash));
    const newValidators = Object.keys(newSessionEventData.activeExposures).filter((valid) => !existingValidators.has(valid));
  
    newValidators.forEach(validator => {
      let newExposure = newSessionEventData.activeExposures[validator];
      newExposure.own = (Number(newExposure.own) + Number(newRewardEventData.amount)).toString(); // This will be modified as per new criteria or information.
  
      const newValidatorEntry = {
        stash: validator,
        name: null,
        exposure : newExposure,
        block : event.blockNumber,
        eventType : newRewardEventData.kind,
        commissionPer : newSessionEventData.commissionPer,
        eraPoints : newSessionEventData.eraPoints,
        apr : apr,
        uptime: 0,
        movingAverages : 0,
        isOnline: true,
        isElected : true,
        toBeElected : false,
        hasMessage : false,
        created_at : new Date().toISOString(),
        updated_at : new Date().toISOString()
      }
      validatorsList.push(newValidatorEntry);
    });

    // 4) create and update event details in db
    // await models.HistoricalValidatorStatistic.bulkCreate( validatorsList, {ignoreDuplicates: true} );
    await Promise.all(validatorsList.map( (row: any) => {
      return this._models.HistoricalValidatorStatistic.create( row, {ignoreDuplicates: true} );
    }));

    return dbEvent;
  }
}