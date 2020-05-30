import m from 'mithril';
import { formatNumber } from '@polkadot/util';
import { BlockNumber } from '@polkadot/types/interfaces';

interface IValidatorState {
  isNominating: boolean;
}
interface IValidatorAttrs {
  title: string;
  total: BlockNumber;
  value: BlockNumber;
}

const ActionForm: m.Component<IValidatorAttrs, IValidatorState> = {
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

export default ActionForm;
