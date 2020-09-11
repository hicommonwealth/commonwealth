import moment from 'moment-twitter'
import {AssetInfo} from '../models/AssetInfo'

// duplicated in helpers.ts
// changes:  num.tofixed(2) 
export function formatNumberShort(num: number) {
    const round = (n, digits?) => {
        if (digits === undefined) digits = 2
        return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits)
    }

    const precise = (n, digits?) => {
        if (digits === undefined) digits = 3
        return n.toPrecision(digits)
    }

    return num > 1_000_000_000_000 ? round(num / 1_000_000_000_000).toFixed(2) + 't'
        : num > 1_000_000_000 ? round(num / 1_000_000_000).toFixed(2) + 'b'
            : num > 1_000_000 ? round(num / 1_000_000).toFixed(2) + 'm'
                : num > 1_000 ? round(num / 1_000).toFixed(2) + 'k'
                    : num > 0.1 ? round(num).toFixed(2)
                        : num > 0.01 ? Number(precise(num, 2)).toFixed(2)
                            : num > 0.001 ? Number(precise(num, 1)).toFixed(2)
                                : num.toFixed(2)
}

// duplicated in client/scripts/helpers/index.ts
// changes:  Year, Month, Day added  
export function formatDuration(duration: moment.Duration, short = true) {
    const res = [] // final formatted result
    duration.add(10, 'seconds') // buffer of 10 seconds to get accurate day (was not accurate as computing takes few ms)
    const years = Math.floor(duration.asYears())
    if (years) {
        res.push(`${years} ${short ? 'Y' : 'Year'}${years > 1 ? 's' : ''} `)
        duration.add(-372 * years, 'days')
    }
    const months = Math.floor(duration.asMonths())
    if (months) {
        res.push(`${months} ${short ? 'M' : 'Month'}${months > 1 ? 's' : ''} `)
        duration.add(-31 * months, 'days')
    }
    const days = Math.floor(duration.asDays())
    if (days) {
        res.push(`${days} ${short ? 'D' : 'Day'}${days > 1 ? 's' : ''} `)
        duration.add(-1 * days, 'days')
    }
    if (duration.hours()) {
        res.push(
            `${duration.hours()}${short ? 'h' : ' Hour'}${
            duration.hours() > 1 ? 's' : ''
            } `,
        )
    }
    if (duration.minutes()) {
        res.push(
            `${duration.minutes()}${short ? 'M' : ' Minute'}${
            duration.minutes() > 1 ? 's' : ''
            } `,
        )
    }
    return res.join('')
}

export function calcRewards(
    astinf: AssetInfo,
    compound: boolean,
    stakingAmount: number,
    stakingLength: number,
    totalSupply: number,
    stakedSupply: number,
  ) {
    /* test constants 
    let currentStakedPercent = 0.6533;
    astinf.calculatedInterestRate = 0.052;
    astinf.rewardFrequencyHours = 24;
    totalSupply = 8102224;
    stakedSupply = currentStakedPercent * totalSupply; 
    */
  
    // for non compounding simple version
    let earningsAtEnd =
      stakingAmount +
      stakingAmount * astinf.calculatedInterestRate * (stakingLength / 365)
    let endTotalSupply =
      totalSupply + stakedSupply * astinf.calculatedInterestRate * (365 / 365)
    let currentNetworkShare = stakingAmount / totalSupply
    let endNetworkShare = earningsAtEnd / endTotalSupply
    let diffNetworkShare = endNetworkShare - currentNetworkShare
    let adjustedReward = diffNetworkShare * (endTotalSupply / stakingAmount) * 100
  
    if (compound) {
      console.log('running compound!')
      // compound mode
      let compoundInterestRate =
        Math.pow(1 + astinf.calculatedInterestRate / 365, 365) - 1
      let compoundEndEarnings =
        stakingAmount * Math.pow(1 + compoundInterestRate, stakingLength / 365)
      let compoundEndSupply = endTotalSupply - earningsAtEnd + compoundEndEarnings
      endNetworkShare = compoundEndEarnings / compoundEndSupply
      diffNetworkShare = endNetworkShare - currentNetworkShare
      adjustedReward =
        diffNetworkShare * (compoundEndSupply / stakingAmount) * 100
      earningsAtEnd = compoundEndEarnings
    }
    let earnings = earningsAtEnd - stakingAmount
    let rewardRate = (earnings / stakingAmount) * 100
    earnings = earnings - earnings * astinf.commission
  
    currentNetworkShare = currentNetworkShare * 100
    if (currentNetworkShare > 100) {
      currentNetworkShare = 100
    }
    console.log('networkValue: ', currentNetworkShare)
    console.log('adjustedReward: ', adjustedReward)
    console.log('earnings: ', earnings)
    console.log('rewardRate: ', rewardRate)
  
    return {
      earnings: earnings,
      rewardRate: rewardRate,
      networkValue: currentNetworkShare * 100,
      adjustedReward: adjustedReward,
    }
  }

  export function calculateInterestLeftRight(astinf: AssetInfo, selected_rate: number){
    const iLeft =
    astinf.consts.minInflationRate +
    (selected_rate / 100) *
    (astinf.consts.idealInterestRate -
      astinf.consts.minInflationRate / astinf.consts.idealStakeRate)
  const iRight =
    astinf.consts.minInflationRate +
    (astinf.consts.idealInterestRate * astinf.consts.idealStakeRate -
      astinf.consts.minInflationRate) *
    Math.pow(
      2,
      (astinf.consts.idealStakeRate - selected_rate / 100) /
      astinf.consts.decayRate,
    )
    return {
      left: iLeft,
      right: iRight
    }
  }