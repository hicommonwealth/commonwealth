import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import { ValidatorInstance } from '../models/validator';

export default class extends IEventHandler {
  constructor(
    private readonly _models,
  ) {
    super();
  }

  /**
   * Event handler to store new session validators details in DB.
   */
  public async handle(event: CWEvent < IChainEventData > , dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.NewSession) {
      return dbEvent;
    }

    // 2) get data from existing validators
    const newSessionEventData = event.data;

    const existingValidators: ValidatorInstance = await this._models.Validator.findAll({});
    let allValidators = JSON.parse(JSON.stringify(existingValidators));

    let newValidator = []; 
    newSessionEventData.active.forEach(validator => {
      newValidator[validator] = {
        state: 'active',
        visited: false
      }
    });
    newSessionEventData.waiting.forEach(validator => {
      newValidator[validator] = {
        state: 'waiting',
        visited: false
      }
    });

    allValidators.forEach(validator => {
      const stashId = newValidator[validator.stash];
      if (stashId) {
        validator.state = stashId.state;
        validator.lastUpdate = event.blockNumber.toString();
        newValidator[validator.stash].visited = true;
      }
    });

    // 3) Get new validator for DB entries 
    Object.keys(newValidator).filter((validatorKey) => !newValidator[validatorKey].visited).forEach((stashId) => {
      const newValidatorEntry = {
        stash: stashId,
        controller: null,
        sessionKeys: [],
        state: newValidator[stashId].state,
        lastUpdate: event.blockNumber.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      allValidators.push(newValidatorEntry);
    })

    // 4) create and update event details in db
    await this._models.Validator.save();

    return dbEvent;
  }
}