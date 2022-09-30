import 'pages/profile.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { checkAddressChecksum, toChecksumAddress } from 'web3-utils';
import bs58 from 'bs58';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ChainBase } from 'common-common/src/types';
import { Thread, Comment, Profile } from 'models';

import Sublayout from 'views/sublayout';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';

import {
  decodeAddress,
  checkAddress,
  encodeAddress,
} from '@polkadot/util-crypto';
import { bech32 } from 'bech32';
import { setActiveAccount } from 'controllers/app/login';
import { modelFromServer as modelThreadFromServer } from 'controllers/server/threads';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';
import ProfileHeader from './profile_header';
import ProfileContent from './profile_content';
import ProfileBio from './profile_bio';
import ProfileBanner from './profile_banner';

const getProfileStatus = (account) => {
  const onOwnProfile =
    account.chain.id === app.user.activeAccount?.chain?.id &&
    account.address === app.user.activeAccount?.address;
  const onLinkedProfile =
    !onOwnProfile &&
    app.user.activeAccounts.length > 0 &&
    app.user.activeAccounts
      .filter((account_) => {
        return app.roles.getRoleInCommunity({
          account: account_,
          chain: app.activeChainId(),
        });
      })
      .filter((account_) => {
        return account_.address === account.address;
      }).length > 0;

  // if the profile that we are visiting is in app.activeAddresses() but not the current active address,
  // then display the ProfileBanner
  // TODO: display the banner if the current address is in app.activeAddresses() and *is* a member of the
  // community (this will require alternate copy on the banner)
  let isUnjoinedJoinableAddress;
  let currentAddressInfo;
  if (!onOwnProfile && !onLinkedProfile) {
    const communityOptions = { chain: app.activeChainId() };
    const communityRoles = app.roles.getAllRolesInCommunity(communityOptions);
    const joinableAddresses = app.roles.getJoinableAddresses(communityOptions);
    const unjoinedJoinableAddresses =
      joinableAddresses.length > communityRoles.length
        ? joinableAddresses.filter((addr) => {
            return (
              communityRoles.filter((role) => {
                return role.address_id === addr.id;
              }).length === 0
            );
          })
        : [];
    const currentAddressInfoArray = unjoinedJoinableAddresses.filter((addr) => {
      return addr.id === account.id;
    });
    isUnjoinedJoinableAddress = currentAddressInfoArray.length > 0;
    if (isUnjoinedJoinableAddress) {
      currentAddressInfo = currentAddressInfoArray[0];
    }
  }

  return {
    onOwnProfile,
    onLinkedProfile,
    displayBanner: isUnjoinedJoinableAddress,
    currentAddressInfo,
  };
};

export enum UserContent {
  All = 'posts',
  Threads = 'threads',
  Comments = 'comments',
}

interface IProfilePageAttrs {
  address: string;
  setIdentity?: boolean;
}
interface IProfilePageState {
  account;
  threads: Thread[];
  comments: Comment<any>[];
  initialized: boolean;
  loaded: boolean;
  loading: boolean;
  refreshProfile: boolean;
  tabSelected: number;
  onscroll: any;
  allContentCount: number;
  proposalsContentCount: number;
  commentsContentCount: number;
}

const checkCosmosAddress = (address: string): boolean => {
  try {
    // 50 character max string length to throw on pubkey
    const { prefix, words } = bech32.decode(address, 50);
    // TODO: should we verify prefix as well?
    return true;
  } catch (e) {
    return false;
  }
};

const checkSolanaAddress = (address: string): boolean => {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch (e) {
    return false;
  }
};

const loadProfile = async (
  attrs: IProfilePageAttrs,
  state: IProfilePageState
) => {
  const chain =
    m.route.param('base') || app.customDomainId() || m.route.param('scope');
  const { address } = attrs;
  const chainInfo = app.config.chains.getById(chain);
  let valid = false;
  if (chainInfo?.base === ChainBase.Substrate) {
    const ss58Prefix = parseInt(chainInfo.ss58Prefix, 10);
    [valid] = checkAddress(address, ss58Prefix);
  } else if (chainInfo?.base === ChainBase.Ethereum) {
    valid = checkAddressChecksum(address);
  } else if (chainInfo?.base === ChainBase.CosmosSDK) {
    valid = checkCosmosAddress(address);
  } else if (chainInfo?.base === ChainBase.NEAR) {
    valid = true;
  } else if (chainInfo?.base === ChainBase.Solana) {
    valid = checkSolanaAddress(address);
  }
  if (!valid) {
    return;
  }
  state.loading = true;
  state.initialized = true;
  try {
    const response = await $.ajax({
      url: `${app.serverUrl()}/profile`,
      type: 'GET',
      data: {
        address,
        chain,
        jwt: app.user.jwt,
      },
    });

    const { result } = response;
    state.loaded = true;
    state.loading = false;
    const a = result.account;
    const profile = new Profile(a.chain, a.address);
    if (a.OffchainProfile) {
      const profileData = JSON.parse(a.OffchainProfile.data);
      // ignore off-chain name if substrate id exists
      if (a.OffchainProfile.identity) {
        profile.initializeWithChain(
          a.OffchainProfile.identity,
          profileData?.headline,
          profileData?.bio,
          profileData?.avatarUrl,
          a.OffchainProfile.judgements,
          a.last_active,
          a.is_councillor,
          a.is_validator
        );
      } else {
        profile.initialize(
          profileData?.name,
          profileData?.headline,
          profileData?.bio,
          profileData?.avatarUrl,
          a.last_active,
          a.is_councillor,
          a.is_validator
        );
      }
    } else {
      profile.initializeEmpty();
    }
    const account = {
      profile,
      chain: a.chain,
      address: a.address,
      id: a.id,
      name: a.name,
      user_id: a.user_id,
      ghost_address: a.ghost_address,
    };
    state.account = account;
    state.threads = result.threads.map((t) => modelThreadFromServer(t));
    state.comments = result.comments.map((c) => modelCommentFromServer(c));
    m.redraw();
  } catch (err) {
    // for certain chains, display addresses not in db if formatted properly
    if (chainInfo?.base === ChainBase.Substrate) {
      try {
        decodeAddress(address);
        state.account = {
          profile: null,
          chain,
          address,
          id: null,
          name: null,
          user_id: null,
        };
      } catch (e) {
        // do nothing if can't decode
      }
    } else if (chainInfo?.base === ChainBase.Ethereum) {
      if (checkAddressChecksum(address)) {
        state.account = {
          profile: null,
          chain,
          address,
          id: null,
          name: null,
          user_id: null,
        };
      }
    } else if (chainInfo?.base === ChainBase.CosmosSDK) {
      if (checkCosmosAddress(address)) {
        state.account = {
          profile: null,
          chain,
          address,
          id: null,
          name: null,
          user_id: null,
        };
      }
    } else if (chainInfo?.base === ChainBase.Solana) {
      if (checkSolanaAddress(address)) {
        state.account = {
          profile: null,
          chain,
          address,
          id: null,
          name: null,
          user_id: null,
        };
      }
    }
    state.loaded = true;
    state.loading = false;
    m.redraw();
    if (!state.account)
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to find profile'
      );
  }
};

const postsRemaining = (contentLength, count) => {
  return contentLength > 10 && count < contentLength;
};

const ProfilePage: m.Component<IProfilePageAttrs, IProfilePageState> = {
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.tabSelected = 0;
    vnode.state.initialized = false;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.threads = [];
    vnode.state.comments = [];
    vnode.state.refreshProfile = false;
    const chain =
      m.route.param('base') || app.customDomainId() || m.route.param('scope');
    const { address } = vnode.attrs;
    const chainInfo = app.config.chains.getById(chain);
    const baseSuffix = m.route.param('base');

    if (chainInfo?.base === ChainBase.Substrate) {
      const decodedAddress = decodeAddress(address);
      const ss58Prefix = parseInt(chainInfo.ss58Prefix, 10);

      const [valid] = checkAddress(address, ss58Prefix);
      if (!valid) {
        try {
          const encoded = encodeAddress(decodedAddress, ss58Prefix);
          navigateToSubpage(
            `/account/${encoded}${baseSuffix ? `?base=${baseSuffix}` : ''}`
          );
        } catch (e) {
          // do nothing if can't encode address
        }
      }
    } else if (chainInfo?.base === ChainBase.Ethereum) {
      const valid = checkAddressChecksum(address);

      if (!valid) {
        try {
          const checksumAddress = toChecksumAddress(address);
          navigateToSubpage(
            `/account/${checksumAddress}${
              baseSuffix ? `?base=${baseSuffix}` : ''
            }`
          );
        } catch (e) {
          // do nothing if can't get checksumAddress
        }
      }
    }
  },
  oncreate: async (vnode) => {},
  view: (vnode) => {
    const { setIdentity } = vnode.attrs;
    const { account, loaded, loading, refreshProfile } = vnode.state;
    if (!loading && !loaded) {
      loadProfile(vnode.attrs, vnode.state);
    }
    if (account && account.address !== vnode.attrs.address) {
      vnode.state.loaded = false;
      loadProfile(vnode.attrs, vnode.state);
    }
    if (loading) return m(PageLoading, { showCreateContentMenuTrigger: true });
    if (!account && !vnode.state.initialized) {
      return m(PageNotFound, { message: 'Invalid address provided' });
    } else if (!account) {
      return m(PageLoading, { showCreateContentMenuTrigger: true });
    }

    if (!vnode.state.allContentCount) {
      vnode.state.allContentCount = 10;
    }

    if (!vnode.state.proposalsContentCount) {
      vnode.state.proposalsContentCount = 10;
    }

    if (!vnode.state.commentsContentCount) {
      vnode.state.commentsContentCount = 10;
    }

    const { onOwnProfile, onLinkedProfile, displayBanner, currentAddressInfo } =
      getProfileStatus(account);

    if (refreshProfile) {
      loadProfile(vnode.attrs, vnode.state);
      vnode.state.refreshProfile = false;
      if (onOwnProfile) {
        setActiveAccount(account).then(() => {
          m.redraw();
        });
      } else {
        m.redraw();
      }
    }

    const onscroll = _.debounce(() => {
      const tab = vnode.state.tabSelected;
      if (tab === 0) {
        if (!postsRemaining(allContent.length, vnode.state.allContentCount))
          return;
      } else if (tab === 1) {
        if (
          !postsRemaining(proposals.length, vnode.state.proposalsContentCount)
        )
          return;
      } else {
        if (!postsRemaining(comments.length, vnode.state.commentsContentCount))
          return;
      }
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > scrollHeight - 400) {
        if (tab === 0) {
          vnode.state.allContentCount += 20;
          const thisUrl = m.route.get();
          if (m.route.get() === thisUrl)
            window.location.hash = vnode.state.allContentCount.toString();
        } else if (tab === 1) {
          vnode.state.proposalsContentCount += 20;
          const thisUrl = m.route.get();
          if (m.route.get() === thisUrl)
            window.location.hash = vnode.state.proposalsContentCount.toString();
        } else {
          vnode.state.commentsContentCount += 20;
          const thisUrl = m.route.get();
          if (m.route.get() === thisUrl)
            window.location.hash = vnode.state.commentsContentCount.toString();
        }
        m.redraw();
      }
    }, 400);

    // TODO: search for cosmos proposals, if ChainBase is Cosmos
    const comments = vnode.state.comments.sort(
      (a, b) => +b.createdAt - +a.createdAt
    );
    const proposals = vnode.state.threads.sort(
      (a, b) => +b.createdAt - +a.createdAt
    );
    const allContent = []
      .concat(proposals || [])
      .concat(comments || [])
      .sort((a, b) => +b.createdAt - +a.createdAt);

    const allTabTitle =
      proposals && comments
        ? ['All ', proposals.length + comments.length]
        : 'All';
    const threadsTabTitle = proposals
      ? ['Threads ', proposals.length]
      : 'Threads';
    const commentsTabTitle = comments
      ? ['Comments ', comments.length]
      : 'Comments';

    return m(
      Sublayout,
      {
        showCreateContentMenuTrigger: true,
        onscroll,
      },
      [
        m('.ProfilePage', [
          displayBanner &&
            m(ProfileBanner, {
              account,
              addressInfo: currentAddressInfo,
            }),
          m('.row.row-narrow.forum-row', [
            m('.col-xs-12 .col-md-8', [
              m(ProfileHeader, {
                account,
                setIdentity,
                onOwnProfile,
                onLinkedProfile,
                refreshCallback: () => {
                  vnode.state.refreshProfile = true;
                },
              }),
              m(CWTabBar, [
                m(CWTab, {
                  label: allTabTitle,
                  onclick: () => {
                    vnode.state.tabSelected = 0;
                  },
                  isSelected: vnode.state.tabSelected === 0,
                }),
                m(CWTab, {
                  label: threadsTabTitle,
                  onclick: () => {
                    vnode.state.tabSelected = 1;
                  },
                  isSelected: vnode.state.tabSelected === 1,
                }),
                m(CWTab, {
                  label: commentsTabTitle,
                  onclick: () => {
                    vnode.state.tabSelected = 2;
                  },
                  isSelected: vnode.state.tabSelected === 2,
                }),
              ]),
              vnode.state.tabSelected === 0 &&
                m(ProfileContent, {
                  account,
                  type: UserContent.All,
                  content: allContent,
                  count: vnode.state.allContentCount,
                  // eslint-disable-next-line max-len
                  localStorageScrollYKey: `profile-${
                    vnode.attrs.address
                  }-${m.route.param('base')}-${app.activeChainId()}-scrollY`,
                }),
              vnode.state.tabSelected === 1 &&
                m(ProfileContent, {
                  account,
                  type: UserContent.Threads,
                  content: proposals,
                  count: vnode.state.proposalsContentCount,
                  // eslint-disable-next-line max-len
                  localStorageScrollYKey: `profile-${
                    vnode.attrs.address
                  }-${m.route.param('base')}-${app.activeChainId()}-scrollY`,
                }),
              vnode.state.tabSelected === 2 &&
                m(ProfileContent, {
                  account,
                  type: UserContent.Comments,
                  content: comments,
                  count: vnode.state.commentsContentCount,
                  // eslint-disable-next-line max-len
                  localStorageScrollYKey: `profile-${
                    vnode.attrs.address
                  }-${m.route.param('base')}-${app.activeChainId()}-scrollY`,
                }),
            ]),
            m('.xs-display-none .col-md-4', [
              m(ProfileBio, {
                account,
                setIdentity,
                onOwnProfile,
                onLinkedProfile,
                refreshCallback: () => {
                  vnode.state.refreshProfile = true;
                },
              }),
            ]),
          ]),
        ]),
      ]
    );
  },
};

export default ProfilePage;
