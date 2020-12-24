import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import { sequelize } from '../database';
import Sequelize from 'sequelize';
const Op = Sequelize.Op;


const uptimePercent = (noOfTrues: number, noOfFalse: number, currentEventType: number) => {
  /*
    This formula is used to calculate the uptime percentage of the validators based on previous sessions' uptime.
    upTimePercentage = ((No. isOnline True(s) + Current Execution Mode [1 for AllGood, 0 for SomeOffline]) /
                        (No. isOnline True(s) + No. isOnline False(s) - 1 + 1)) * 100
  */
  const upTimePercentage = (((noOfTrues + currentEventType) / (noOfTrues + noOfFalse - 1 + 1)) * 100)
    .toFixed(2);

  return upTimePercentage;
};

export default class extends IEventHandler {
  constructor(
    private readonly _models
  ) {
    super();
  }

  /**
    Event handler to store ImOnline information of validators details in DB.
    Sample Payload - all-good :
                    {
                      data: {
                        kind: 'all-good',
                        validators: [
                          'nYST5VF8q99P8P2xVUBH829YxfHUSUXN9cuCLNmyPuTbo74',
                          ...
                        ]
                      },
                      blockNumber: 800
                    }
                    
    Sample Payload - some-offline:
                    {
                      "kind": "some-offline",
                      "validators": [
                        "[\"mv8WxQF82gB65Ug4RTzF7g8g854fHrGQj6FetuoX2FUTyKf\",{\"total\":\"0x00000000000e3ac49ae4a139b7cfa6de\",\"own\":\"0x00000000000100c2d4f9deef529358f4\",\"others\":[{\"who\":\"nn1kbW7MAdKLYSNCNDUSmZ2aAxcsqAXii4kbUK5TEqP2CSd\",\"value\":\"0x00000000000060b5f1fc8d42339ea968\"},{\"who\":\"kmX4JrFRdUepcqh4WKERBMQAbT6mS8UPgQpQAfmvJ9134KU\",\"value\":\"0x00000000000060b5f1eac9c8f238033b\"},{\"who\":\"jnE6pYL9RDfFAohjDasMUTfn9fFc9aMa1tAxp3wYL6QL1eS\",\"value\":\"0x00000000000000002d65f6bd5e7033eb\"},{\"who\":\"ivVni3ZZxWV6p4rYpiZidb5iZp5Kti5jHozg5jZSyrn8Q2n\",\"value\":\"0x00000000000000f34f056bdde5ee73d0\"},{\"who\":\"jYueRWWePWx63D75ShmoV6PWU5UnxMFX1vLM5NRahYwUBgU\",\"value\":\"0x00000000000427e0cc8802db46ed2f84\"},{\"who\":\"iHNihG3VgrQHd4hHtUH9EfwQQmhpmFXVRw9bzKFiZokL3D3\",\"value\":\"0x00000000000427e0cc8802db46ed2f84\"},{\"who\":\"jboHgKhnqJbU2MowSpzYCCzima3rHBomwh2y88Tn7kC37B3\",\"value\":\"0x00000000000427e0cc8802ed6d2c9a84\"}]}]",
                        ...
                      ],
                      "sessionIndex": 31392
                    }
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.AllGood
      && event.data.kind !== SubstrateTypes.EventKind.SomeOffline) {
      return dbEvent;
    }

    const imOnlineEventData = event.data;
    let eventValidatorsList: string | any[];
    if (event.data.kind === SubstrateTypes.EventKind.SomeOffline) {
      eventValidatorsList = imOnlineEventData.validators?.map(validator=>JSON.parse(validator)[0]);
    }else{
      eventValidatorsList = imOnlineEventData.validators;
    }

    // Get all the records for all validators from database those are in new-session's active and waiting list.
    const existingValidators = await this._models.Validator.findAll({
      where: {
        stash: {
          [Op.in]: eventValidatorsList
        }
      }
    });
    if (!existingValidators || existingValidators.length === 0) return dbEvent;

    // 2) Get relevant data from DB for processing.
    /*
      This query will return the last created record for validators in 'HistoricalValidatorStatistic' table and return the data for each validator with there onlineCount and offlineCount counts iff any.
      since all new and active validators records has been created by new-session event handler, it'll return the the last created records of them.
    */
    const rawQuery = `
      SELECT *
      FROM( 
        SELECT * ,ROW_NUMBER() OVER( PARTITION BY partitionTable.stash ORDER BY created_at DESC ) 
        FROM public."HistoricalValidatorStatistic" as partitionTable
        JOIN( 
          SELECT stash, SUM(case when "isOnline" then 1 else 0 end) as "onlineCount", SUM(case when "isOnline"  then 0 else 1 end) as "offlineCount" 
          FROM public."HistoricalValidatorStatistic" as groupTable GROUP by groupTable.stash
          ) joinTable
        ON joinTable.stash = partitionTable.stash
        WHERE partitionTable.stash IN ('${eventValidatorsList.join("','")}')
        )  as validatorQuery
      WHERE  validatorQuery.row_number = 1
    `;
    const [validators, metadata] = await sequelize.query(rawQuery);
    const validatorsList = JSON.parse(JSON.stringify(validators));

    // 3) Modify uptime for validators.
    switch (imOnlineEventData.kind) {
      case SubstrateTypes.EventKind.AllGood: {
        validatorsList.forEach((validator: any) => {
          validator.uptime = uptimePercent(Number(validator.onlineCount), Number(validator.offlineCount), 1).toString();  // 1 for AllGood event
          validator.isOnline = true;
        });
        break;
      }
      case SubstrateTypes.EventKind.SomeOffline: {
        validatorsList.forEach((validator: any) => {
          validator.uptime = uptimePercent(Number(validator.onlineCount), Number(validator.offlineCount), 0).toString();  // 0 for SomeOffline event
          validator.isOnline = false;
        });
        break;
      }
      default: {
        return dbEvent;
      }
    }
    validatorsList.forEach((validator: any) => {
      validator.block = event.blockNumber.toString();
      validator.eventType = imOnlineEventData.kind;
      validator.created_at = new Date().toISOString();
      validator.updated_at = new Date().toISOString();
      delete validator.id;
      delete validator.onlineCount;
      delete validator.offlineCount;
      delete validator.row_number;
    });

    // 4) create/update event data in database.
    // await this._models.HistoricalValidatorStatistic.bulkCreate( validatorsList, {ignoreDuplicates: true} );
    await Promise.all(validatorsList.map((row: any) => {
      return this._models.HistoricalValidatorStatistic.create(row);
    }));

    return dbEvent;
  }
}
