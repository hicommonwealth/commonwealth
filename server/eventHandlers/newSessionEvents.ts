import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import { ValidatorInstance } from '../models/validator';

export default class extends IEventHandler {
  constructor(
    private readonly _models
  ) {
    super();
  }

  /**
    * Event handler to store new-session's validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.NewSession) {
      return dbEvent;
    }
    const newSessionEventData = event.data;

    // 2) get data from existing validators
    const existingValidators: ValidatorInstance = await this._models.Validator.findAll({});
    let allValidators = JSON.parse(JSON.stringify(existingValidators));

    // merging up the active and waiting validators into the one list.
    let newValidator = [];
    newSessionEventData.active.forEach((validator: any) => {
      newValidator[validator] = {
        state: 'Active',
        visited: false
      };
    });
    newSessionEventData.waiting.forEach((validator: any) => {
      newValidator[validator] = {
        state: 'Waiting',
        visited: false
      };
    });

    // update state and other details of all validators.
    allValidators.forEach((validator: any) => {
      const stashId = newValidator[validator.stash];
      const validatorsInfo = newSessionEventData.validatorInfo[stashId];
      validator.updated_at = new Date().toISOString();

      if (stashId) {
        validator.state = stashId.state;
        validator.controller = validatorsInfo.controllerId;
        validator.sessionKeys = validatorsInfo.nextSessionIds;
        validator.lastUpdate = event.blockNumber.toString();
        newValidator[validator.stash].visited = true;
      } else {
        validator.state = 'Inactive';
      }
    });

    // 3) Add new validators entries for DB
    Object.keys(newValidator).filter((validatorKey) => !newValidator[validatorKey].visited).forEach((stashId) => {
      const validatorsInfo = newSessionEventData.validatorInfo[stashId];

      const newValidatorEntry = {
        name: null,
        stash: stashId,
        state: newValidator[stashId].state,
        controller: validatorsInfo.controllerId,
        sessionKeys: validatorsInfo.nextSessionIds,
        lastUpdate: event.blockNumber.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allValidators.push(newValidatorEntry);
    });

    // 4) Add validators records in db.
    await Promise.all(allValidators.map((row: any) => {
      return this._models.Validator.upsert(row);
    }));

    // 5) Create new Historical validator statistics record for new validators.
    let newValidatorForHistoricalStats = [];
    for (const validator of Object.keys(newSessionEventData.activeExposures)) {
      const latestExposure = newSessionEventData.activeExposures[validator];

      const validatorEntry = {
        name: null,
        stash: validator,
        exposure: latestExposure,
        block: event.blockNumber.toString(),
        commissionPer: newSessionEventData.validatorInfo[validator].commissionPer,
        eraPoints: newSessionEventData.validatorInfo[validator].eraPoints,
        eventType: newSessionEventData.kind,
        apr: 0, // This is for first time validator
        uptime: 0,
        isElected: true,
        hasMessage: false,
        isOnline: false,
        toBeElected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newValidatorForHistoricalStats.push(validatorEntry);
    }

    // 4) Add validators records in db.
    await Promise.all(allValidators.map((row: any) => {
      return this._models.HistoricalValidatorStatistic.create(row, { ignoreDuplicates: true });
    }));

    return dbEvent;
  }
}
