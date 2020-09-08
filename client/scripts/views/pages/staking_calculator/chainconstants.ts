export const CHAIN_CONST: ChainConstants[] = [{
    symbol: 'EDG',
    const: {
        minInflationRate: 0.025,
        maxInflationRate: 0.10,
        idealStakeRate: 0.5,
        decayRate: 0.05,
        idealInterestRate: 0.2
    }
}]

interface ChainConstant {
    minInflationRate: number
    maxInflationRate: number
    idealStakeRate: number
    decayRate: number
    idealInterestRate: number
}

interface ChainConstants {
    symbol: string;
    const: ChainConstant;
}

export default ChainConstant