import m from 'mithril';
import { DeriveStakingAccount } from '@polkadot/api-derive/types';

interface IAddressInfoAttrs {
  address: string;
  withHexSessionId: string[];
  stakingAccount: DeriveStakingAccount
}

const AddressInfo: m.Component<IAddressInfoAttrs, {}> = {
  view: (vnode) => {
    const { withHexSessionId, stakingAccount } = vnode.attrs;
    const commission = stakingAccount?.validatorPrefs.commission;

    return m('div.address-info',
      withHexSessionId && withHexSessionId[0] && m('div.session-keys', [
        m('label.gray-txt', 'session keys'),
        m('span.val', withHexSessionId[0])
      ]),
      withHexSessionId && withHexSessionId[0] !== withHexSessionId[1] && m('div.session-next', [
        m('label.gray-txt', 'session next'),
        m('span.val', withHexSessionId[1])
      ]),
      commission && m('div.session-next', [
        m('label.gray-txt', 'commission'),
        m('span.val', `${(commission.unwrap().toNumber() / 10_000_000).toFixed(2)}%`)
      ]));
  },
};

export default AddressInfo;
