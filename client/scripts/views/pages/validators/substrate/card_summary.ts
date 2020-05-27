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
    const per = (value.muln(10000).div(total).toNumber() / 100);
    const perText = per < 0 || per > 100
      ? ''
      : `${per.toFixed(2)}%`;

    return m('.validators-preheader-item', [
      m('h3', title),
      m('.preheader-item-text', `${formatNumber(value)}/${formatNumber(total)}`),
      m('.preheader-item-sub-text', perText)
    ]);
  },
};

export default ActionForm;
