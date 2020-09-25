import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';


export default class extends IEventHandler {
  constructor(
    private readonly _models
  ) {
    super();
  }

  /**
    Event handler to store boned and unbond information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Bonded
      && event.data.kind !== SubstrateTypes.EventKind.Unbonded) {
      return dbEvent;
    }
    const bondEventData = event.data;

    // 2) Get relevant data from DB for processing.
    const latestValidators = await this._models.HistoricalValidatorStatistic.findOne({
      where: {
        stash: bondEventData.stash
      },
      order: [
        ['created_at', 'DESC']
      ]
    });
    if (!latestValidators) {
      return dbEvent;
    }
    let validator = JSON.parse(JSON.stringify(latestValidators));

    // 3) Modify exposures for validators.
    switch (bondEventData.kind) {
      case SubstrateTypes.EventKind.Bonded: {
        validator.exposure.own = (Number(validator.exposure.own) + Number(bondEventData.amount)).toString();
        validator.exposure.total = (Number(validator.exposure.total) + Number(bondEventData.amount)).toString();
        break;
      }
      case SubstrateTypes.EventKind.Unbonded: {
        validator.exposure.own = (Number(validator.exposure.own) - Number(bondEventData.amount)).toString();
        validator.exposure.total = (Number(validator.exposure.total) - Number(bondEventData.amount)).toString();
        break;
      }
      default: {
        return dbEvent;
      }
    }
    validator.block = event.blockNumber.toString();
    validator.eventType = bondEventData.kind;
    validator.created_at = new Date().toISOString();
    validator.updated_at = new Date().toISOString();
    delete validator.id;

    // 4) create/update event data in database.
    await this._models.HistoricalValidatorStatistic.create( validator );

    return dbEvent;
  }
}

