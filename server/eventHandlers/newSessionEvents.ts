import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import Sequelize from 'sequelize';
const Op = Sequelize.Op;


export default class extends IEventHandler {
  constructor(
    private readonly _models
  ) {
    super();
  }

  /**
    Event handler to store new-session's validators details in DB.
    Sample Payload:
                  {
                    "data": {
                      "kind": "new-session",
                      "activeExposures": {
                        "nBEPWLmcAoSDPNoFKuKZXyAwEMtfhz7RU9nzRAZfjD5v9Eb": {
                          "own": "0x000000000000005d59ea50d4ae28b3f0",
                          "total": "0x00000000000045695e3f39b202770ee8",
                          "others": [
                            {
                              "who": "jdxmHQWrvgFhzLtWzvpHHvc496J3bR98ZAvNKEkVHGV3gsT",
                              "value": "0x00000000000004e68ea14311bf263b90"
                            },
                            ...
                          ]
                        },
                        ...
                      },
                      "active": [
                        "nBEPWLmcAoSDPNoFKuKZXyAwEMtfhz7RU9nzRAZfjD5v9Eb",
                        ...
                      ],
                      "waiting": [],
                      "sessionIndex": 6,
                      "currentEra": 1,
                      "validatorInfo": {
                        "nBEPWLmcAoSDPNoFKuKZXyAwEMtfhz7RU9nzRAZfjD5v9Eb": {
                          "commissionPer": 0,
                          "controllerId": "mVkyikJBD8P6XPpsdVMTXzbSBsPD1U1oD9EYqTgpiWxUctx",
                          "rewardDestination": "Staked",
                          "nextSessionIds": [],
                          "eraPoints": 0
                        },
                        ...
                      }
                    },
                    "blockNumber": 600
                  }
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.NewSession) {
      return dbEvent;
    }
    const newSessionEventData = event.data;

    // 2) Get relevant data from DB for processing and updating back to database.
    // merging up the active and waiting validators into the one list.
    const newValidators = [];
    newSessionEventData.active.forEach((validator: any) => {
      newValidators[validator] = {
        state: 'Active',
        visited: false
      };
    });
    newSessionEventData.waiting.forEach((validator: any) => {
      newValidators[validator] = {
        state: 'Waiting',
        visited: false
      };
    });

    // Directly mark all validators as "Inactive" in the database those are not in new-session's active and waiting list.
    const updateOlderValidators = await this._models.Validator.update(
      { state: 'Inactive' },
      {
        where: {
          stash: {
            [Op.notIn]: Object.keys(newValidators)
          }
        }
      }
    );

    // Get all the records for all validators from database those are in new-session's active and waiting list.
    const existingValidators = await this._models.Validator.findAll({
      where: {
        stash: {
          [Op.in]: Object.keys(newValidators)
        }
      }
    });
    const allValidators = JSON.parse(JSON.stringify(existingValidators));

    // update existing validators with new state and other details of all validators.
    allValidators.forEach((validator: any) => {
      const stashId = newValidators[validator.stash];

      if (stashId && stashId.length > 0) {
        const validatorsInfo = (newSessionEventData as any).validatorInfo[validator.stash]; 
        validator.state = stashId.state;
        validator.controller = validatorsInfo.controllerId;
        validator.sessionKeys = validatorsInfo.nextSessionIds;
        validator.lastUpdate = event.blockNumber.toString();
        newValidators[validator.stash].visited = true;
        validator.updated_at = new Date().toISOString();
      }
    });

    // 3) Add new validators entries with their details
    Object.keys(newValidators).filter((validatorKey) => !newValidators[validatorKey].visited).forEach((stashId) => {
      const validatorsInfo = (newSessionEventData as any).validatorInfo[stashId];
      const newValidatorEntry = {
        name: null,
        stash: stashId,
        state: newValidators[stashId].state,
        controller: validatorsInfo.controllerId,
        sessionKeys: validatorsInfo.nextSessionIds,
        lastUpdate: event.blockNumber.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allValidators.push(newValidatorEntry);
    });

    // 4) Add validators records in Validator table.
    await Promise.all(allValidators.map((row: any) => {
      return this._models.Validator.upsert(row);
    }));

    // 5) Create new Historical validator statistics record for new validators.
    const newValidatorForHistoricalStats = [];
    for (const validator of Object.keys(newSessionEventData.activeExposures)) {
      const exposure = newSessionEventData.activeExposures[validator];

      const validatorEntry = {
        name: null,
        stash: validator,
        exposure,
        block: event.blockNumber.toString(),
        commissionPer: (newSessionEventData as any).validatorInfo[validator].commissionPer,
        eraPoints: (newSessionEventData as any).validatorInfo[validator].eraPoints,
        eventType: newSessionEventData.kind,
        apr: 0, // to be computed later on for first time validator.
        uptime: 0,
        isElected: true,
        isOnline: false,
        hasMessage: false,
        toBeElected: false,
        rewardsStats: {},
        slashesStats: {},
        offencesStats: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newValidatorForHistoricalStats.push(validatorEntry);
    }
    // 4) Add validators records HistoricalValidatorStatistic in table.
    await Promise.all(newValidatorForHistoricalStats.map((row: any) => {
      return this._models.HistoricalValidatorStatistic.create(row, { ignoreDuplicates: true });
    }));

    return dbEvent;
  }
}
