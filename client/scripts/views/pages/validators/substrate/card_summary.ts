import m from 'mithril';
import { formatNumber } from '@polkadot/util';
import { BlockNumber } from '@polkadot/types/interfaces';

interface IValidatorAttrs {
  title: string;
  total: BlockNumber;
  value: BlockNumber;
}

const CardSummary: m.Component<IValidatorAttrs, {}> = {
  view: (vnode) => {
    const { total, value, title } = vnode.attrs;
    const percentage: number = (value.muln(10000).div(total).toNumber() / 100);
    const percentageText: string = percentage < 0 || percentage > 100
      ? ''
      : `${percentage.toFixed(2)}%`;

    return percentageText && m('.validators-preheader-item', [
      m('h3', title),
      m('.preheader-item-text', `${formatNumber(value)}/${formatNumber(total)}`),
      m('.preheader-item-sub-text', percentageText)
    ]);
  },
};

export default CardSummary;
