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
}

interface IOnboardingChooseWalletState {
  search: string;
  selected: string;
}

const ChooseWallet: m.Component<IOnboardingChooseWalletAttr, IOnboardingChooseWalletState> = {
  oninit: (vnode) => {
    vnode.state.selected = null;
    vnode.state.search = '';
  },
  view: (vnode) => {
    const getWalletItemForChainBase = (base: ChainBase) => m('div.item', {
      class: vnode.state.selected === base ? 'selected' : '',
      onclick: () => {
        vnode.state.selected = base;
      }
    }, [
      m(ChainBaseIcon, { chainbase: base, size: 40 }),
      base
    ]);

    const allChains = app.config.chains.getAll();
    const sortedChainBases = [ChainBase.CosmosSDK, ChainBase.Ethereum, ChainBase.NEAR, ChainBase.Substrate].filter((base) => allChains.find((chain) => chain.base === base));

    const chainbase = app.chain?.meta?.chain?.base;
    const items = app.chain ? [ getWalletItemForChainBase(chainbase) ] : sortedChainBases.map((base) => getWalletItemForChainBase(base));

    return m('.OnboardingChooseWallet', [
      m('div.title', [
        m('div.icons', [
          m.trust(onboardingChooseWalletIcon),
        ]),
        m('h2', 'Choose a Wallet'),
      ]),
      m('div.content', [
        m(Form, { class: 'OnboardingChooseWalletForm' }, [
          m(FormGroup, [
            m(Input, {
              name: 'search',
              placeholder: 'Type to filter wallets',
              oninput: (e) => {
                const result = (e.target as any).value;
                vnode.state.search = result;
                m.redraw();
              }
            }),
          ])
        ]),
        m('div.wallets', [items]),
      ]),
      m(OnboardingFooterActions, {
        backDisabled: false,
        nextDisabled: !vnode.state.selected,
        onBack: vnode.attrs.onBack,
        onNext: vnode.attrs.onNext,
      })
    ]);
  },
};

export default ChooseWallet;
