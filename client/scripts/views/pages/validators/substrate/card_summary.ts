import m from 'mithril';
import { formatNumber } from '@polkadot/util';
import { BlockNumber } from '@polkadot/types/interfaces';


interface IValidatorAttrs {
  title: string;
  total: BlockNumber;
  value: BlockNumber;
  currentBlock?: string;
}
// TODOO: CHNAGE THESES VALUES TO ACTUAL
const CardSummary: m.Component<IValidatorAttrs, {}> = {
  view: (vnode) => {
    const { total, value, title, currentBlock } = vnode.attrs;
    // const percentage: number = (value.muln(10000).div(total).toNumber() / 100);
    const percentage: number = 85;
    const percentageText: number = percentage < 0 || percentage > 100
      ? null
      : percentage;
    return percentageText
      && m(`.validators-preheader-item${title.toLowerCase() === 'epoch' || title.toLowerCase() === 'era'
        ? '-progressbox.validators-preheader-item'
        : ''}`, [
        m('h3', title),
        currentBlock !== undefined && m('span.preheader-item-text.bold-text', `#${currentBlock}`),
        m('span.preheader-item-text.gray-text', `${formatNumber(85)}/${formatNumber(100)}`),
        m(`.bar-outer${title.toLowerCase() === 'era'
          ? '-era'
          : '-epoch'}`,
        m(`.bar-inner${title.toLowerCase() === 'era'
          ? '-era'
          : '-epoch'}`, { style: `width: ${percentageText}%` }))
      ]);
  },
};

export default CardSummary;
