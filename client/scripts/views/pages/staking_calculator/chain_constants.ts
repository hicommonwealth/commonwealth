import { ChainConstants } from '../../../models/ChainConstant'

export const CHAIN_CONST: ChainConstants[] = [{
    //Fetched from      : https://github.com/hicommonwealth/edgeware-node/blob/4da8fb14776a75d788a7a90c180887375bc9fca8/node/runtime/src/lib.rs#L251
    //Fetced Date (UTC) : 2020-09-11T04:01:13Z
    symbol: 'EDG',
    const: {
        minInflationRate: 0.025000,
        maxInflationRate: 0.100000,
        idealStakeRate: 0.800000,
        decayRate: 0.050000, /*falloff*/
        idealInterestRate: 0.2
    }
},
{
    //Fetched from      : N/A
    //Fetced Date (UTC) : N/A
    symbol: 'KSM',
    const: {
        minInflationRate: 0.025000,
        maxInflationRate: 0.100000,
        idealStakeRate: 0.800000,
        decayRate: 0.050000, /*falloff*/
        idealInterestRate: 0.2
    }
},
{
    //Fetched from      : N/A
    //Fetced Date (UTC) : N/A
    symbol: 'NEAR',
    const: {
        minInflationRate: 0.025000,
        maxInflationRate: 0.100000,
        idealStakeRate: 0.800000,
        decayRate: 0.050000, /*falloff*/
        idealInterestRate: 0.2
    }
},
{
    //Fetched from      : N/A
    //Fetced Date (UTC) : N/A
    symbol: 'DOT',
    const: {
        minInflationRate: 0.025000,
        maxInflationRate: 0.100000,
        idealStakeRate: 0.800000,
        decayRate: 0.050000, /*falloff*/
        idealInterestRate: 0.2
    }
},
{
    //Fetched from      : N/A
    //Fetced Date (UTC) : N/A
    symbol: 'MOLOCH',
    const: {
        minInflationRate: 0.025000,
        maxInflationRate: 0.100000,
        idealStakeRate: 0.800000,
        decayRate: 0.050000, /*falloff*/
        idealInterestRate: 0.2
    }
}
]

