import 'modals/onboarding_modal/join_community.scss';

import m from 'mithril';
import app from 'state';
import { Form, FormGroup, Input, ListItem } from 'construct-ui';
import { Account, ChainBase, ChainInfo, CommunityInfo, RoleInfo } from 'models';

import { String } from 'aws-sdk/clients/cloudsearch';

import { onboardingJoinCommunityIcon } from '../../components/sidebar/icons';
import OnboardingFooterActions from './footer_actions';
import { CommunityLabel } from '../../components/sidebar/community_selector';

interface IOnboardingJoinCommunityAttr {
  account: Account<any>;
  onBack: () => void;
  onNext: () => void;
  selected?: ChainBase;
  onSelect?: (base: ChainBase) => void;
  base: ChainBase;
}

interface IOnboardingJoinCommunityState {
  search: string;
  favourited: (CommunityInfo | ChainInfo)[];
  saving: boolean;
  error: String;
}

const JoinCommunity: m.Component<IOnboardingJoinCommunityAttr, IOnboardingJoinCommunityState> = {
  oninit: (vnode) => {
    vnode.state.search = '';
    vnode.state.favourited = [];
    vnode.state.saving = false;
    vnode.state.error = null;
  },
  view: (vnode) => {
    const { account, base } = vnode.attrs;
    console.log(app.config.chains.getAll());
    const allCommunities = (app.config.communities.getAll() as (CommunityInfo | ChainInfo)[])
      .concat(app.config.chains.getAll().filter((chain) => chain.base === base))
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => {
        // sort starred communities at top
        if (a instanceof ChainInfo && app.communities.isStarred(a.id, null)) return -1;
        if (a instanceof CommunityInfo && app.communities.isStarred(null, a.id)) return -1;
        return 0;
      })
      .filter((item) => {
        // only show chains with nodes
        return (item instanceof ChainInfo)
          ? app.config.nodes.getByChain(item.id)?.length
          : true;
      });

    const renderCommunity = (item) => {
      const roles: RoleInfo[] = [];
      if (item instanceof CommunityInfo) {
        roles.push(...app.user.getAllRolesInCommunity({ community: item.id }));
      } else if (item instanceof ChainInfo) {
        roles.push(...app.user.getAllRolesInCommunity({ chain: item.id }));
      }

      const selectedIndex = vnode.state.favourited.findIndex((_) => _.id === item.id);

      return item instanceof ChainInfo
        ? m(ListItem, {
          class: selectedIndex >= 0 ? 'selected' : '',
          label: m(CommunityLabel, { chain: item }),
          onclick: (e) => {
            if (selectedIndex >= 0)
              vnode.state.favourited.splice(selectedIndex, 1);
            else
              vnode.state.favourited.push(item);
          },
        })
        : item instanceof CommunityInfo
          ? m(ListItem, {
            class: selectedIndex >= 0 ? 'selected' : '',
            label: m(CommunityLabel, { community: item }),
            onclick: () => {
              if (selectedIndex >= 0)
                vnode.state.favourited.splice(selectedIndex, 1);
              else
                vnode.state.favourited.push(item);
            },
          }) : null;
    };

    const matchCommunity = (name: string) => {
      if (!name) return false;
      return name.toLowerCase().includes(vnode.state.search.toLowerCase());
    };

    return m('.OnboardingJoinCommunity', [
      m('div.title', [
        m('div.icons', [
          m.trust(onboardingJoinCommunityIcon),
        ]),
        m('h2', 'Join your favourite communities '),
      ]),
      m('div.content', [
        m(Form, { class: 'OnboardingJoinCommunityForm' }, [
          m(FormGroup, [
            m(Input, {
              name: 'search',
              placeholder: 'Type to filter communities',
              autoComplete: 'off',
              oninput: (e) => {
                const result = (e.target as any).value;
                vnode.state.search = result;
                m.redraw();
              }
            }),
          ])
        ]),
        m('div.communities', [
          allCommunities.filter((_) => matchCommunity(_.name)).map(renderCommunity),
        ]),
      ]),
      m(OnboardingFooterActions, {
        backDisabled: vnode.state.saving,
        nextDisabled: vnode.state.saving,
        nextSpinning: vnode.state.saving,
        isLast: true,
        onBack: vnode.attrs.onBack,
        onNext: () => {
          console.log(vnode.state.favourited);
          const promises = [];

          vnode.state.saving = true;
          // app.profiles.updateProfileForAccount(account, data).then((result) => {
          //   vnode.state.saving = false;
          //   m.redraw();
          //   vnode.attrs.onNext();
          // }).catch((error: any) => {
          //   vnode.state.saving = false;
          //   vnode.state.error = error.responseJSON ? error.responseJSON.error : error.responseText;
          //   m.redraw();
          // });
          const addressInfo = app.user.addresses.find((a) => a.address === account.address && a.chain === account.chain.id);

          vnode.state.favourited.map((item) => {
            if (item instanceof ChainInfo && !app.user.getRoleInCommunity({ account, chain: item.id })) {
              promises.push(app.user.createRole({ address: addressInfo, chain: item.id }));
            } else if (item instanceof CommunityInfo && !app.user.getRoleInCommunity({ account, community: item.id })) {
              promises.push(app.user.createRole({ address: addressInfo, community: item.id }));
            }
          });

          Promise.all(promises).then(() => {
            vnode.state.saving = false;
            vnode.state.error = null;
            vnode.attrs.onNext();
          }).catch((err) => {
            console.error(err);
            vnode.state.error = 'Error';
            vnode.state.saving = false;
          });
        },
        count: vnode.state.favourited.length
      })
    ]);
  },
};

export default JoinCommunity;
