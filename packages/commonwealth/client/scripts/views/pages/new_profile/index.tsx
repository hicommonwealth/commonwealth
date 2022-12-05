import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Spinner } from 'construct-ui';

import 'pages/new_profile.scss';
import {
  Thread,
  IUniqueId,
  ChainInfo,
  AddressInfo,
  SocialAccount,
  NewProfile as Profile,
  Comment,
} from 'models';

import NewProfileActivity from "./new_profile_activity";
import NewProfileHeader from "./new_profile_header";
import Sublayout from '../../sublayout';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
  InsufficientProfileData, // when does this get used?
}

type NewProfileAttrs = {
  placeholder?: string;
};

type NewProfileState = {
  address: string;
  profile: Profile;
  threads: Array<Thread>;
  comments: Array<Comment<IUniqueId>>;
  chains: Array<ChainInfo>;
  addresses: Array<AddressInfo>;
  socialAccounts: Array<SocialAccount>;
  loading: boolean;
  error: ProfileError;
  content: m.Vnode<NewProfileAttrs, NewProfileState>;
};

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

const getProfileData = async (state: NewProfileState) => {
  const response: any = await $.get(`${app.serverUrl()}/profile/v2`, {
    address: state.address,
    jwt: app.user.jwt,
  }).catch((err) => {
    if (
      err.status === 500 &&
      err.responseJSON.error === NoAddressFoundError
    ) {
      state.error = ProfileError.NoAddressFound;
    }
    if (
      err.status === 500 &&
      err.responseJSON.error === NoProfileFoundError
    ) {
      state.error = ProfileError.NoProfileFound;
    }
    state.loading = false;
  });
  if (state.error !== ProfileError.None) return;

  state.profile = new Profile(response.profile);
  state.threads = response.threads.map((t) => new Thread(t));
  state.comments = response.comments.map((c) => new Comment(c));
  state.chains = response.chains.map((c) => new ChainInfo(c));
  state.addresses = response.addresses.map(
    (a) =>
      new AddressInfo(
        a.id,
        a.address,
        a.chain,
        a.keytype,
        a.wallet_id,
        a.ghost_address
      )
  );
  state.socialAccounts = response.socialAccounts.map(
    (a) => new SocialAccount(a.provider, a.provider_username)
  );
};

const NewProfile: m.Component<NewProfileAttrs, NewProfileState> = {
  oninit(vnode: m.Vnode<NewProfileAttrs, NewProfileState>) {
    vnode.state.address = m.route.param('address');
    vnode.state.loading = true;
    vnode.state.error = ProfileError.None;
    getProfileData(vnode.state);
    vnode.state.loading = false;
    m.redraw();
  },
  view: (vnode: m.Vnode<NewProfileAttrs, NewProfileState>) => {
    const { loading, error } = vnode.state;

    if (loading)
      vnode.state.content = (
        m('.ProfilePage', [
          m('.loading-spinner', [
            m(Spinner, {
              active: true,
              size: 'lg',
            }),
          ]),
        ])
      )

    if (error === ProfileError.NoAddressFound)
      vnode.state.content = (
        m('.ProfilePage', [
          m('.ErrorPage', [
            m('h3', 'Not on Commonwealth'),
            m('p', 'If this is your address, sign in using your wallet to set up a profile.'),
          ]),
        ])
      );

    if (error === ProfileError.NoProfileFound)
      vnode.state.content = (
        m('.ProfilePage', [
          m('.ErrorPage', [
            m('h3', 'No profile found'),
            m('p', 'This address is not registered to Commonwealth.'),
          ]),
        ])
      );

    if (error === ProfileError.None)
      vnode.state.content = (
        m('.ProfilePage', [
          m('.ProfilePageContainer', [
            m(NewProfileHeader, {
              profile: vnode.state.profile,
              address: vnode.state.address,
              socialAccounts: vnode.state.socialAccounts,
              }),
            m(NewProfileActivity, {
              threads: vnode.state.threads,
              comments: vnode.state.comments,
              chains: vnode.state.chains,
              addresses: vnode.state.addresses,
            })
          ]),
        ])
      );

    return m(Sublayout, [
      vnode.state.content,
    ]);
  },
};

export default NewProfile;
