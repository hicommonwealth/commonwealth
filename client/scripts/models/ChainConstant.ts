export interface ChainConstant {
    minInflationRate: number
    maxInflationRate: number
    idealStakeRate: number
    decayRate: number
    idealInterestRate: number
}

export interface ChainConstants {
    symbol: string;
    const: ChainConstant;
}

