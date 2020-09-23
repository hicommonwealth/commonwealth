import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import getLast30DaysStats  from './computeStats'
import Sequelize from 'sequelize';
const Op = Sequelize.Op;


export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string
  ) {
    super();
  }

  /**
    Event handler to store slash information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Slash) {
      return dbEvent;
    }
    const newSlashEventData = event.data;

    // 2) Get relevant data from DB for processing.
    // Check for the stash id whether it is in validator table or not.
    let validatorStash = "";
    let newExposure;

    const validatorRecord = await this._models.Validator.findOne({
      where: {
        [Op.and]: [{ stash: newSlashEventData.validator }, { state: 'Active' }]
      },
    });
    let validator = JSON.parse(JSON.stringify(validatorRecord));

    if (validator){
      validatorStash = validator.stash;
    } else {
      let activeExposures = [];
      let slashedNominators = {};

      for (let valid of Object.keys(activeExposures)) {
        activeExposures[valid].other.forEach(nominator => {
          if (nominator.who === newSlashEventData.validator){
            slashedNominators[valid] = activeExposures[valid];
          }
        })
      }

      if (Object.keys(slashedNominators).length === 1){
        validatorStash = Object.keys(slashedNominators)[0];
        newExposure = slashedNominators[validatorStash];
        newExposure.total = (Number(newExposure.total) - Number(newSlashEventData.amount)).toString()
  
        newExposure.other.map((nominator) =>{
          if (nominator.who === newSlashEventData.validator){
            nominator.value = (Number(nominator.value) - Number(newSlashEventData.amount))
            return nominator;
          }
        })

      } else if (Object.keys(slashedNominators).length > 1){
        // pass
        // TODO: once finalized how we'll apply slash on the validator's exposure then modify the logic based to decided criteria.
        // Multiple nominators presence need to be computed based on final discussion.
      }
    }

    // Get last created validator's record from 'HistoricalValidatorStatistic' table. as slash event contains validator's AccountID.
    const latestValidatorStats = await this._models.HistoricalValidatorStatistic.findOne({
      where: {
        stash: validatorStash
      },
      order: [
        ['created_at', 'DESC']
      ]
    });
    let latestValidator = JSON.parse(JSON.stringify(latestValidatorStats));

    if ( newExposure ) {
      latestValidator.exposure = newExposure;
    } else {
      latestValidator.exposure.own = (Number(latestValidator.exposure.own) - Number(newSlashEventData.amount)).toString();
      latestValidator.exposure.total = (Number(latestValidator.exposure.total) - Number(newSlashEventData.amount)).toString();
    }

    // Added Last 30 days Slash count and averages for a validator.
    const [thirtyDaysAvg, thirtyDaysCount] = await getLast30DaysStats(this._chain, newSlashEventData.kind, newSlashEventData.validator);
    validator.slashesStats = {count: thirtyDaysCount, avg: thirtyDaysAvg }

    // 3) Modify exposures for validators based of slash balance.
    latestValidator.block = event.blockNumber.toString();
    latestValidator.eventType = newSlashEventData.kind;
    latestValidator.apr = 0; // TODO: APR to be computed over here
    latestValidator.created_at = new Date().toISOString();
    latestValidator.updated_at = new Date().toISOString();
    delete latestValidator.id;

    // 4) create/update event data in database.
    await this._models.HistoricalValidatorStatistic.create( latestValidator );

    return dbEvent;
  }
}
