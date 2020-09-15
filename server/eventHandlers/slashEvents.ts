import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';


export default class extends IEventHandler {
  constructor(
    private readonly _models
  ) {
    super();
  }

  /**
    * Event handler for slash information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData > ,dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Slash) {
      return dbEvent;
    }
    const newSlashEventData = event.data;

    // 2) check for the latest historical validator data from db
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

    // 3) Modify new exposures for validators
    validator.exposure.own = (Number(validator.exposure.own) - Number(newSlashEventData.amount)).toString();
    validator.exposure.total = (Number(validator.exposure.total) - Number(newSlashEventData.amount)).toString();
    validator.block = event.blockNumber.toString();
    validator.eventType = newSlashEventData.kind;
    validator.apr = 0; // APR to be updated over here
    validator.created_at = new Date().toISOString();
    validator.updated_at = new Date().toISOString();
    delete validator.id;

    // 4) create and update event details in db
    await this._models.HistoricalValidatorStatistic.create(validator, { ignoreDuplicates: true });

    return dbEvent;
  }
}
