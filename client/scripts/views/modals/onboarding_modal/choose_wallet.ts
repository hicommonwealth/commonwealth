import 'modals/onboarding_modal/choose_wallet.scss';

import { Form, FormGroup, Input } from 'construct-ui';
import m from 'mithril';
import app from 'state';

import { ChainBase } from '../../../models';
import { onboardingChooseWalletIcon } from '../../components/sidebar/icons';
import { ChainBaseIcon } from '../../components/chain_icon';
import OnboardingFooterActions from './footer_actions';

interface IOnboardingChooseWalletAttr {
  onBack: () => void;
  onNext: () => void;
  selected: ChainBase;
  onSelect: (base: ChainBase) => void;
}

interface IOnboardingChooseWalletState {
  search: string;
}

const ChooseWallet: m.Component<IOnboardingChooseWalletAttr, IOnboardingChooseWalletState> = {
  oninit: (vnode) => {
    vnode.state.search = '';
  },
  view: (vnode) => {
    const getWalletItemForChainBase = (base: ChainBase) => m('div.item', {
      class: vnode.attrs.selected === base ? 'selected' : '',
      onclick: () => {
        vnode.attrs.onSelect(base);
      }
    }, [
      m(ChainBaseIcon, { chainbase: base, size: 40 }),
      base
    ]);

    const matchBase = (base: ChainBase) => {
      if (!base) return false;
      return base.toLowerCase().includes(vnode.state.search.toLowerCase());
    };

    const allChains = app.config.chains.getAll();
    const sortedChainBases = Object.values(ChainBase).filter((base) => allChains.find((chain) => chain.base === base));

    const chainbase = app.chain?.meta?.chain?.base;
    const items = app.chain ? (matchBase(chainbase) ? [ getWalletItemForChainBase(chainbase) ] : []) : sortedChainBases.filter((base) => matchBase(base)).map((base) => getWalletItemForChainBase(base));

    return m('.OnboardingChooseWallet', [
      m('div.title', [
        m('div.icons', [
          m.trust(onboardingChooseWalletIcon),
        ]),
        m('h2', 'Choose Your Wallet'),
      ]),
      m('div.content', [
        m(Form, { class: 'OnboardingChooseWalletForm' }, [
          m(FormGroup, [
            m(Input, {
              name: 'search',
              placeholder: 'Type to filter wallets',
              autoComplete: 'off',
              oninput: (e) => {
                const result = (e.target as any).value;
                vnode.state.search = result;
                m.redraw();
              },
            }),
          ])
        ]),
        m('div.wallets', [items]),
      ]),
      m(OnboardingFooterActions, {
        backDisabled: false,
        nextDisabled: !vnode.attrs.selected,
        onBack: vnode.attrs.onBack,
        onNext: () => vnode.attrs.onNext(),
      })
    ]);
  },
};

export default ChooseWallet;
