import { EventKind, AccountId, BalanceString } from '@commonwealth/chain-events/dist/substrate/types'
import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import { HistoricalValidatorStatisticsAttributes } from '../models/historical_validator_statistics'
import { Exposure, BlockNumber, IndividualExposure } from '@polkadot/types/interfaces';

interface IEvent {
    kind: EventKind;
}

interface IEventData {
    stash: AccountId;
    exposure: Exposure;
    block: BlockNumber;
}

export interface IUnbonded extends IEvent {
    kind: EventKind.Unbonded;
    stash: AccountId;
    amount: BalanceString;
    controller: AccountId;
}

export default class extends IEventHandler {
    constructor(
        private readonly _models,
        private readonly _chain: string,
    ) {
        super();
    }

    /**
     * Event handler to store new session validators details in DB.
     */
    public async handle(event: CWEvent<IChainEventData>, dbEvent) {
        // 1) if other event type ignore and do nothing.
        if (event.data.kind !== SubstrateTypes.EventKind.Unbonded) {
            return dbEvent;
        }

        const bond: IUnbonded = event.data;
        let hval: IEventData = JSON.parse(JSON.stringify(await this._models.HistoricalValidatorStatistic.findOne({
            where: { stash: bond.stash }
        })))

        await this._models.HistoricalValidatorStatistic.create({
            stash: hval.stash,
            block: hval.block,
            exposure: {
                own: (Number(hval.exposure.own) - Number(bond.amount)),
                total: (Number(hval.exposure.total) - Number(bond.amount)),
                others: hval.exposure.others
            }
        })

        return dbEvent;
    }
}



