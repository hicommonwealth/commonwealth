import m from 'mithril';
import Substrate from 'controllers/chain/substrate/main';
import Tabs from '../../../components/widgets/tabs';
import AccountActions from './account_actions';

const PresentationComponent = (state, chain: Substrate) => {
  const { ownStashInfos } = state.dynamic;

  return m('div.manage-staking-presentation',
    m(Tabs, [{
      name: 'Manage Staking',
      content: m(AccountActions, { ownStashInfos })
    }]));
};

export default PresentationComponent;
