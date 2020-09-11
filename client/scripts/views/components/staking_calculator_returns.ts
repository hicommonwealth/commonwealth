import m from 'mithril'
import { formatNumberShort, formatDuration, calcRewards } from '../../helpers/calculator_helper'
import moment from 'moment-twitter'
import { AssetInfo } from '../../models/AssetInfo'

export const CalculatorReturnsContent: m.Component<{
    rateInHour: number
    astinf: AssetInfo
    switch_mode: boolean
    stakingAmount: number
    stakingLength: number
    class_val: string
    inventory_coins: number
    staked_supply: number
}, {}> = {
    view: (vnode) => {
        const duration = formatDuration(
            moment.duration(
                moment().add(vnode.attrs.rateInHour, 'hours').diff(moment()),
            ),
            false,
        )
        const d = calcRewards(
            vnode.attrs.astinf,
            vnode.attrs.switch_mode,
            vnode.attrs.stakingAmount,
            vnode.attrs.stakingLength,
            vnode.attrs.inventory_coins,
            vnode.attrs.staked_supply,
        )
        return m(`.returns_content_div.col-lg-4${vnode.attrs.class_val}`, [
            m('strong', `${duration} @ ${formatNumberShort(d.rewardRate)} %`),
            m('p', `${formatNumberShort(d.earnings)} EDG`),
            m(
                'span',
                `($ ${
                vnode.attrs.astinf.usd_value
                    ? formatNumberShort(d.earnings * vnode.attrs.astinf.usd_value)
                    : '--'
                })`,
            ),
        ])
    },
}