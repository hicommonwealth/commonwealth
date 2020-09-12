import {ChainConstant} from './ChainConstant'

export class AssetInfo {
    name: string
    sym: string
    icon: string
    usd_value: number
    consts: ChainConstant
    calculatedInterestRate: number
    commission: number
    rewardFrequencyMinutes: number
    totalSupply: number
    //staked : number
    //totalStaked: number
  }