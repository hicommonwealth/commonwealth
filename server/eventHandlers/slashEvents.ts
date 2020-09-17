import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';


export default class extends IEventHandler {
  constructor(
    private readonly _models
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
    // Get last created validator's record from 'HistoricalValidatorStatistic' table. as slash event contains validator's AccountID.
    const latestValidators = await this._models.HistoricalValidatorStatistic.findOne({
      where: {
        stash: newSlashEventData.validator
      },
      order: [
        ['created_at', 'DESC']
      ]
    });
    if (!latestValidators) {
      return dbEvent;
    }

    let validator = JSON.parse(JSON.stringify(latestValidators));

    // 3) Modify exposures for validators based of slash balance.
    // TODO: once finalized how we'll apply slash on the validator's exposure then modify the logic based to decided criteria.
    validator.exposure.own = (Number(validator.exposure.own) - Number(newSlashEventData.amount)).toString();
    validator.exposure.total = (Number(validator.exposure.total) - Number(newSlashEventData.amount)).toString();
    validator.block = event.blockNumber.toString();
    validator.eventType = newSlashEventData.kind;
    validator.apr = 0; // TODO: APR to be computed over here
    validator.created_at = new Date().toISOString();
    validator.updated_at = new Date().toISOString();
    delete validator.id;

    // 4) create/update event data in database.
    await this._models.HistoricalValidatorStatistic.create( validator );

    return dbEvent;
  }
}
