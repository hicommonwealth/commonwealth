import 'modals/create_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Button, Input, Form, FormGroup, FormLabel, Select, RadioGroup, ListItem, List, Spinner, SelectList, Icons } from 'construct-ui';

import Web3 from 'web3';
import moment from 'moment';
import app from 'state';
import { CommunityInfo, ChainInfo, RoleInfo, ChainBase, Profile } from 'models';
import { CompactModalExitButton } from 'views/modal';
import { checkAddress, decodeAddress } from '@polkadot/util-crypto';
import { notifyError } from 'controllers/app/notifications';
import { UserBlock } from '../components/widgets/user';
export interface SearchParams {
  communityScope?: string;
  chainScope?: string;
  resultSize?: number;
}

interface IInviteButtonAttrs {
  selection: string,
  successCallback: Function,
  failureCallback: Function,
  invitedAddress?: string,
  invitedEmail?: string,
  invitedAddressChain?: string,
  community?: CommunityInfo,
  chain?: ChainInfo,
  disabled?: boolean
}

enum SearchType {
  Member = 'member',
}

interface ICommunityOption {
  label: string,
  value: string
}

const SEARCH_PREVIEW_SIZE = 10;

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const getBalancedContentListing = (unfilteredResults: any[], types: SearchType[]) => {
  const results = {};
  let unfilteredResultsLength = 0;
  for (const key of types) {
    results[key] = [];
    unfilteredResultsLength += (unfilteredResults[key]?.length || 0);
  }
  let priorityPosition = 0;
  let resultsLength = 0;
  while (resultsLength < 6 && (resultsLength < unfilteredResultsLength)) {
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (resultsLength < 6) {
        const nextResult = unfilteredResults[type][priorityPosition];
        if (nextResult) {
          results[type].push(nextResult);
          resultsLength += 1;
        }
      }
    }
    priorityPosition += 1;
  }
  return results;
};

export const getMemberPreview = (addr, enterAddressFn, closeResultsFn, searchTerm, tabIndex, showChainName?) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);
  return m(ListItem, {
    tabIndex,
    label: m('a.search-results-item', [
      m(UserBlock, {
        user: profile,
        searchTerm,
        avatarSize: 24,
        showAddressWithDisplayName: true,
        showFullAddress: true,
        showChainName,
      }),
    ]),
    onclick: (e) => {
      enterAddressFn(addr.address);
      closeResultsFn();
    },
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        enterAddressFn(addr.address);
        closeResultsFn();
      }
    }
  });
};

const getResultsPreview = (searchTerm: string, state, params: SearchParams) => {
  const { communityScope, chainScope } = params;

  const results = getBalancedContentListing(app.searchAddressCache[searchTerm], [SearchType.Member]);

  const organizedResults = [];
  let tabIndex = 1;

  const res = results[SearchType.Member];
  if (res?.length === 0) return;

  (res as any[]).forEach((item) => {
    tabIndex += 1;
    const resultRow = getMemberPreview(item, state.enterAddress, state.closeResults, searchTerm, tabIndex, !!communityScope);
    organizedResults.push(resultRow);
  });

  return organizedResults;
};

const concludeSearch = (searchTerm: string, params: SearchParams, state, err?) => {
  if (!app.searchAddressCache[searchTerm].loaded) {
    app.searchAddressCache[searchTerm].loaded = true;
  }
  if (err) {
    state.results = {};
    state.errorText = (err.responseJSON?.error || err.responseText || err.toString());
  } else {
    state.results = getResultsPreview(searchTerm, state, params);
  }
  m.redraw();
};

export const searchMentionableAddresses = async (
  searchTerm: string,
  params: SearchParams,
  order?: string[]
) => {
  const { resultSize, communityScope, chainScope } = params;
  try {
    const response = await $.get(`${app.serverUrl()}/bulkAddresses`, {
      chain: chainScope,
      community: communityScope,
      limit: resultSize,
      searchTerm,
      order,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const sortResults = (a, b) => {
  // TODO: Token-sorting approach
  // Some users are not verified; we give them a default date of 1900
  const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
  const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
  return bCreatedAt.diff(aCreatedAt);
};

// Search makes the relevant queries, depending on whether the search is global or
// community-scoped. It then "concludesSearch," and either assigns the results to
// app.searchAddressCache or sends them to getResultsPreview, which creates the relevant
// preview rows
export const search = async (searchTerm: string, params: SearchParams, state) => {
  const { communityScope, chainScope } = params;
  const resultSize = SEARCH_PREVIEW_SIZE;
  if (app.searchAddressCache[searchTerm]?.loaded) {
    // If results exist in cache, conclude search
    concludeSearch(searchTerm, params, state);
  }
  try {
    const addrs = await searchMentionableAddresses(searchTerm, { resultSize, communityScope, chainScope }, ['created_at', 'DESC']);

    app.searchAddressCache[searchTerm].member = addrs.map((addr) => {
      addr.contentType = 'member';
      addr.searchType = SearchType.Member;
      return addr;
    }).sort(sortResults);

    if (communityScope || chainScope) {
      concludeSearch(searchTerm, params, state);
      return;
    }

    concludeSearch(searchTerm, params, state);
  } catch (err) {
    concludeSearch(searchTerm, params, state, err);
  }
};

const InviteButton: m.Component<IInviteButtonAttrs, { loading: boolean, }> = {
  oninit: (vnode) => {
    vnode.state.loading = false;
  },
  view: (vnode) => {
    const { selection, successCallback, failureCallback,
      invitedAddress, invitedEmail, invitedAddressChain, community, chain, disabled } = vnode.attrs;
    return m(Button, {
      class: 'create-invite-button',
      intent: 'primary',
      name: selection,
      loading: vnode.state.loading,
      disabled,
      rounded: true,
      type: 'submit',
      label: selection === 'email' ? 'Send Invite' : 'Add address',
      onclick: (e) => {
        e.preventDefault();
        const address = invitedAddress;
        const emailAddress = invitedEmail;
        const selectedChain = invitedAddressChain;

        if (selection !== 'address' && selection !== 'email') return;
        if (selection === 'address' && (address === '' || address === null)) return;
        if (selection === 'email' && (emailAddress === '' || emailAddress === null)) return;

        vnode.state.loading = true;
        successCallback(false);
        failureCallback(false);

        let postType: string;
        if (selection === 'address') {
          // TODO: Change to POST /member
          postType = '/addMember';
        } else if (selection === 'email') {
          // TODO: Change to POST /invite
          postType = '/createInvite';
        } else {
          return;
        }

        const chainOrCommunityObj = chain ? { chain: chain.id }
          : community ? { community:  community.id }
            : null;
        if (!chainOrCommunityObj) return;

        $.post(app.serverUrl() + postType, {
          address: app.user.activeAccount.address,
          ...chainOrCommunityObj,
          invitedAddress: selection === 'address' ? address : '',
          invitedAddressChain: selection === 'address' ? selectedChain : '',
          invitedEmail: selection === 'email' ? emailAddress : '',
          auth: true,
          jwt: app.user.jwt,
        }).then((response) => {
          vnode.state.loading = false;
          if (response.status === 'Success') {
            successCallback(true);
            if (postType === '/addMember') {
              const { result } = response;
              app.user.addRole(new RoleInfo(
                result.id,
                result.address_id,
                result.address,
                result.address_chain,
                result.chain_id,
                result.offchain_community_id,
                result.permission,
                result.is_user_default
              ));
            }
          } else {
            failureCallback(true, response.message);
          }
          m.redraw();
          mixpanel.track('Invite Sent', {
            'Step No': 2,
            'Step': 'Invite Sent (Completed)'
          });
        }, (err) => {
          failureCallback(true, err.responseJSON.error);
          vnode.state.loading = false;
          m.redraw();
        });
      }
    });
  }
};

const CreateInviteLink: m.Component<{
  chain?: ChainInfo,
  community?: CommunityInfo,
  onChangeHandler?: Function,
}, {
  link: string,
  inviteUses: string,
  inviteTime: string,
}> = {
  oninit: (vnode) => {
    vnode.state.link = '';
    vnode.state.inviteUses = 'none';
    vnode.state.inviteTime = 'none';
  },
  view: (vnode) => {
    const { chain, community, onChangeHandler } = vnode.attrs;
    const chainOrCommunityObj = chain
      ? { chain: chain.id }
      : { community: community.id };
    return m(Form, { class: 'CreateInviteLink' }, [
      m(FormGroup, { span: 12 }, [
        m('h2.invite-link-title', 'Generate Invite Link'),
      ]),
      m(FormGroup, { span: 4 }, [
        m(FormLabel, { for: 'uses', }, 'Number of Uses'),
        m(RadioGroup, {
          name: 'uses',
          options: [
            { value: 'none', label: 'Unlimited uses' },
            { value: '1', label: 'One time use' },
          ],
          value: vnode.state.inviteUses,
          onchange: (e: Event) => { vnode.state.inviteUses = (e.target as any).value; },
        }),
      ]),
      m(FormGroup, { span: 4 }, [
        m(FormLabel, { for: 'time' }, 'Expires after'),
        m(RadioGroup, {
          name: 'time',
          options: [
            { value: 'none', label: 'Never expires' },
            { value: '24h', label: '24 hours' },
            { value: '48h', label: '48 hours' },
            { value: '1w', label: '1 week' },
            { value: '30d', label: '30 days' },
          ],
          value: vnode.state.inviteTime,
          onchange: (e: Event) => { vnode.state.inviteTime = (e.target as any).value; },
        }),
      ]),
      m(FormGroup, { span: 4 }),
      m(FormGroup, { span: 4 }, [
        m(Button, {
          type: 'submit',
          intent: 'primary',
          rounded: true,
          onclick: (e) => {
            e.preventDefault();
            // TODO: Change to POST /inviteLink
            $.post(`${app.serverUrl()}/createInviteLink`, {
              // community_id: app.activeCommunityId(),
              ...chainOrCommunityObj,
              time: vnode.state.inviteTime,
              uses: vnode.state.inviteUses,
              jwt: app.user.jwt,
            }).then((response) => {
              const linkInfo = response.result;
              const url = (app.isProduction) ? 'commonwealth.im' : 'localhost:8080';
              if (onChangeHandler) onChangeHandler(linkInfo);
              vnode.state.link = `${url}${app.serverUrl()}/acceptInviteLink?id=${linkInfo.id}`;
              m.redraw();
            });
          },
          label: 'Get invite link'
        }),
      ]),
      m(FormGroup, { span: 8, class: 'copy-link-line' }, [
        m(Input, {
          id: 'invite-link-pastebin',
          class: 'invite-link-pastebin',
          fluid: true,
          readonly: true,
          placeholder: 'Click to generate a link',
          value: `${vnode.state.link}`,
        }),
        m('img', {
          src: 'static/img/copy_default.svg',
          alt: '',
          class: 'mx-auto',
          onclick: (e) => {
            const copyText = document.getElementById('invite-link-pastebin') as HTMLInputElement;
            copyText.select();
            copyText.setSelectionRange(0, 99999); /* For mobile devices */

            document.execCommand('copy');
          }
        })
      ]),
    ]);
  }
};

const emptySearchPreview : m.Component<{ searchTerm: string }, {}> = {
  view: (vnode) => {
    const { searchTerm } = vnode.attrs;
    return m(ListItem, {
      class: 'no-results',
      label: [
        m('b', searchTerm),
        m('span', 'No addresses found')
      ],
      onclick: (e) => {
        if (searchTerm.length < 4) {
          notifyError('Query must be at least 4 characters');
        }
      }
    });
  }
};

const CreateInviteModal: m.Component<{
  communityInfo?: CommunityInfo;
  chainInfo?: ChainInfo;
}, {
  success: boolean;
  failure: boolean;
  disabled: boolean;
  error: string;
  invitedAddressChain: string;
  invitedEmail: string;
  searchAddressTerm: string;
  inputTimeout: any;
  hideResults: boolean;
  isTyping: boolean;
  results: any[];
  closeResults: Function;
  enterAddress: Function;
  errorText: string;
}> = {
  oncreate: (vnode) => {
    const { chainInfo } = vnode.attrs;
    mixpanel.track('New Invite', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  view: (vnode) => {
    const { communityInfo, chainInfo } = vnode.attrs;
    const chainOrCommunityObj = chainInfo ? { chain: chainInfo }
      : communityInfo ? { community: communityInfo }
        : null;
    if (!chainOrCommunityObj) return;

    const selectedChainId = vnode.state.invitedAddressChain || (chainInfo ? chainInfo.id : app.config.chains.getAll()[0].id);
    const selectedChain = app.config.chains.getById(selectedChainId);
    let isAddressValid = true;

    if (selectedChain?.base === ChainBase.Substrate) {
      try {
        if (vnode.state.searchAddressTerm?.length) {
          decodeAddress(vnode.state.searchAddressTerm);
        } else {
          isAddressValid = false;
        }
      } catch (e) {
        isAddressValid = false;
        console.error(e);
      }
    } else if (selectedChain?.base === ChainBase.Ethereum) {
      try {
        if (vnode.state.searchAddressTerm?.length) {
          isAddressValid = Web3.utils.checkAddressChecksum(vnode.state.searchAddressTerm);
        } else {
          isAddressValid = false;
        }
      } catch (e) {
        isAddressValid = false;
      }
    } else {
      // TODO: check Cosmos & Near?
    }

    const isEmailValid = validateEmail(vnode.state.invitedEmail);

    const { results, searchAddressTerm } = vnode.state;

    const LoadingPreview = m(List, {
      class: 'search-results-loading'
    }, [ m(ListItem, { label: m(Spinner, { active: true }) }) ]);

    const searchResults = (!results || results?.length === 0)
      ? (app.searchAddressCache[searchAddressTerm]?.loaded)
        ? m(List, [ m(emptySearchPreview, { searchTerm: searchAddressTerm }) ])
        : LoadingPreview
      : vnode.state.isTyping
        ? LoadingPreview
        : m(List, { class: 'search-results-list' }, results);

    vnode.state.closeResults = () => { vnode.state.hideResults = true; };
    vnode.state.enterAddress = (address: string) => { vnode.state.searchAddressTerm = address; };

    return m('.CreateInviteModal', [
      m('.compact-modal-title', [
        m('h3', 'Invite members'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, { span: 4 }, [
            m(FormLabel, { class: 'chainSelectLabel' }, 'Community'),
            m(SelectList, {
              closeOnSelect: true,
              items: chainInfo
                ? [{ label: chainInfo.name, value: chainInfo.id, }]
                : app.config.chains.getAll().map((chain) => ({
                  label: chain.name.toString(),
                  value: chain.id.toString(),
                })).sort((a: ICommunityOption, b: ICommunityOption) => {
                  if (a.label > b.label) return 1;
                  if (a.label < b.label) return -1;
                  return 0;
                }),
              itemRender: (item: ICommunityOption) => m(ListItem, {
                label: item.label,
                selected: vnode.state.invitedAddressChain && vnode.state.invitedAddressChain === item.value
              }),
              itemPredicate: (query: string, item: ICommunityOption) => {
                return item.label.toLowerCase().includes(query.toLowerCase());
              },
              onSelect: (item: ICommunityOption) => {
                vnode.state.invitedAddressChain = item.value;
              },
              loading: false,
              popoverAttrs: {
                hasArrow: false
              },
              trigger: m(Button, {
                align: 'left',
                compact: true,
                iconRight: Icons.CHEVRON_DOWN,
                label: selectedChainId,
                style: { minWidth: '100%', height: '40px' }
              }),
              emptyContent: 'No communities found',
              inputAttrs: {
                placeholder: 'Search Community...'
              },
              checkmark: false
            }),
          ]),
          m(FormGroup, { span: 8, style: { 'position': 'relative' } }, [
            m(FormLabel, 'Address'),
            m(Input, {
              fluid: true,
              name: 'address',
              autocomplete: 'off',
              placeholder: 'Type to search...',
              value: vnode.state.searchAddressTerm,
              style: 'height: 40px',
              oninput: (e) => {
                e.stopPropagation();
                vnode.state.isTyping = true;
                vnode.state.searchAddressTerm = e.target.value?.toLowerCase();
                if (vnode.state.hideResults) {
                  vnode.state.hideResults = false;
                }
                if (!app.searchAddressCache[vnode.state.searchAddressTerm]) {
                  app.searchAddressCache[vnode.state.searchAddressTerm] = { loaded: false };
                }
                if (e.target.value?.length > 3) {
                  const params: SearchParams = {
                    communityScope: null,
                    chainScope: vnode.state.invitedAddressChain || (chainInfo ? chainInfo.id : app.config.chains.getAll()[0].id),
                  };
                  clearTimeout(vnode.state.inputTimeout);
                  vnode.state.inputTimeout = setTimeout(() => {
                    vnode.state.isTyping = false;
                    return search(vnode.state.searchAddressTerm, params, vnode.state);
                  }, 500);
                }
              },
            }),
            searchAddressTerm?.length > 3
              && !vnode.state.hideResults
              && searchResults
          ]),
          m(InviteButton, {
            selection: 'address',
            disabled: !isAddressValid,
            successCallback: (v: boolean) => {
              vnode.state.success = v;
              vnode.state.searchAddressTerm = '';
              m.redraw();
            },
            failureCallback: (v: boolean, err?: string,) => {
              vnode.state.failure = v;
              if (err) vnode.state.error = err;
              m.redraw();
            },
            invitedAddress: vnode.state.searchAddressTerm,
            invitedAddressChain: selectedChainId,
            ...chainOrCommunityObj
          }),
        ]),
        m(Form, [
          m(FormGroup, [
            m(FormLabel, 'Email'),
            m(Input, {
              fluid: true,
              name: 'emailAddress',
              autocomplete: 'off',
              placeholder: 'Enter email',
              class: !vnode.state.invitedEmail?.length ? '' : isEmailValid ? 'valid' : 'invalid',
              oninput: (e) => {
                vnode.state.invitedEmail = (e.target as any).value;
              }
            }),
          ]),
          m(InviteButton, {
            selection: 'email',
            disabled: !isEmailValid,
            successCallback: (v: boolean) => {
              vnode.state.success = v;
              vnode.state.invitedEmail = '';
              m.redraw();
            },
            failureCallback: (v: boolean, err?: string,) => {
              vnode.state.failure = v;
              if (err) vnode.state.error = err;
              m.redraw();
            },
            invitedEmail: vnode.state.invitedEmail,
            ...chainOrCommunityObj
          }),
        ]),
        m('div.divider'),
        m(CreateInviteLink, { ...chainOrCommunityObj }),
        vnode.state.success && m('.success-message', [
          'Success! Your invite was sent',
        ]),
        vnode.state.failure && m('.error-message', [
          vnode.state.error || 'An error occurred',
        ]),
      ]),
    ]);
  }
};

export default CreateInviteModal;
