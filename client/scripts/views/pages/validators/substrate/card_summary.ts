import m from 'mithril';
import { formatNumber } from '@polkadot/util';
import { BlockNumber } from '@polkadot/types/interfaces';
import { SessionIndex } from '@polkadot/types/interfaces';

interface IValidatorAttrs {
  title: string;
  total: BlockNumber;
  value: BlockNumber;
  currentBlock?: string
}

const CardSummary: m.Component<IValidatorAttrs, {}> = {
  view: (vnode) => {
    const { total, value, title, currentBlock } = vnode.attrs;
    const percentage: number = (value.muln(10000).div(total).toNumber() / 100);
    const percentageText: number = percentage < 0 || percentage > 100
      ? null
      : percentage;
    return percentageText && m('.validators-preheader-item', [
      m('h3', title),
      currentBlock != undefined && m('span.preheader-item-text.bold-text', `#${currentBlock}`),
      m('span.preheader-item-text.gray-text', `${formatNumber(value)}/${formatNumber(total)}`),
      //m('.preheader-item-sub-text', percentageText)
      m('.bar-outer',
        m('.bar-inner', { style: `width: ${(percentageText / 100) * 100}%` }))
    ]);
  },
};

export default CardSummary;
