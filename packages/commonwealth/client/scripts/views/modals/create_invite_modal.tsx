/* @jsx jsx */
import React from 'react';

import { ClassComponent, redraw, jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import $ from 'jquery';
import { decodeAddress } from '@polkadot/util-crypto';
import { ChainBase } from 'common-common/src/types';

import 'modals/create_invite_modal.scss';
import type { ChainInfo, Profile } from 'models';
import { RoleInfo } from 'models';
import { SearchScope } from 'models/SearchQuery';
import moment from 'moment';

import app from 'state';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { checkAddressChecksum } from 'web3-utils';
import { CWButton } from '../components/component_kit/cw_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWTextInput } from '../components/component_kit/cw_text_input';

type SearchParams = {
  chainScope?: string;
  communityScope?: string;
  resultSize?: number;
};

type InviteButtonAttrs = {
  chain?: ChainInfo;
  disabled?: boolean;
  failureCallback: (isFailure: boolean, err?: string) => void;
  invitedAddress?: string;
  invitedAddressChain?: string;
  invitedEmail?: string;
  selection: string;
  successCallback: (isSuccessful: boolean) => void;
};

type CommunityOption = {
  label: string;
  value: string;
};

const SEARCH_PREVIEW_SIZE = 10;

function validateEmail(email) {
  const re =
    // eslint-disable-next-line max-len
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const getBalancedContentListing = (
  unfilteredResults: any[],
  types: SearchScope[]
) => {
  const results = {};

  let unfilteredResultsLength = 0;

  for (const key of types) {
    results[key] = [];
    unfilteredResultsLength += unfilteredResults[key]?.length || 0;
  }

  let priorityPosition = 0;

  let resultsLength = 0;

  while (resultsLength < 6 && resultsLength < unfilteredResultsLength) {
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

const getMemberPreview = (
  addr,
  enterAddressFn,
  closeResultsFn,
  searchTerm,
  tabIndex,
  showChainName?
) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);

  if (addr.name) profile.initialize(addr.name, null, null, null, null);

  return null; // @TODO @REACT FIX ME
  // return m(ListItem, {
  //   tabIndex,
  //   label: (
  //     <a className="search-results-item">
  //       {m(UserBlock, {
  //         user: profile,
  //         searchTerm,
  //         avatarSize: 24,
  //         showAddressWithDisplayName: true,
  //         showChainName,
  //       })}
  //     </a>
  //   ),
  //   onClick: () => {
  //     enterAddressFn(addr.address);
  //     closeResultsFn();
  //   },
  //   onkeyup: (e) => {
  //     if (e.key === 'Enter') {
  //       enterAddressFn(addr.address);
  //       closeResultsFn();
  //     }
  //   },
  // });
};

const getResultsPreview = (searchTerm: string, state, params: SearchParams) => {
  const { communityScope } = params;

  const results = getBalancedContentListing(
    app.searchAddressCache[searchTerm],
    [SearchScope.Members]
  );

  const organizedResults = [];

  let tabIndex = 1;

  const res = results[SearchScope.Members];

  if (res?.length === 0) return;

  (res as any[]).forEach((item) => {
    tabIndex += 1;

    const resultRow = getMemberPreview(
      item,
      state.enterAddress,
      state.closeResults,
      searchTerm,
      tabIndex,
      !!communityScope
    );
    organizedResults.push(resultRow);
  });

  return organizedResults;
};

const concludeSearch = (
  searchTerm: string,
  params: SearchParams,
  state,
  err?
) => {
  if (!app.searchAddressCache[searchTerm].loaded) {
    app.searchAddressCache[searchTerm].loaded = true;
  }
  if (err) {
    state.results = {};
    state.errorText =
      err.responseJSON?.error || err.responseText || err.toString();
  } else {
    state.results = getResultsPreview(searchTerm, state, params);
  }
  redraw();
};

const searchMentionableAddresses = async (
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
  const aCreatedAt = moment(
    a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z'
  );

  const bCreatedAt = moment(
    b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z'
  );

  return bCreatedAt.diff(aCreatedAt);
};

// Search makes the relevant queries, depending on whether the search is global or
// community-scoped. It then "concludesSearch," and either assigns the results to
// app.searchAddressCache or sends them to getResultsPreview, which creates the relevant
// preview rows
const search = async (searchTerm: string, params: SearchParams, state) => {
  const { communityScope, chainScope } = params;

  const resultSize = SEARCH_PREVIEW_SIZE;

  if (app.searchAddressCache[searchTerm]?.loaded) {
    // If results exist in cache, conclude search
    concludeSearch(searchTerm, params, state);
  }

  try {
    const addrs = await searchMentionableAddresses(
      searchTerm,
      { resultSize, communityScope, chainScope },
      ['created_at', 'DESC']
    );

    app.searchAddressCache[searchTerm].member = addrs.sort(sortResults);

    if (communityScope || chainScope) {
      concludeSearch(searchTerm, params, state);
      return;
    }

    concludeSearch(searchTerm, params, state);
  } catch (err) {
    concludeSearch(searchTerm, params, state, err);
  }
};

class InviteButton extends ClassComponent<InviteButtonAttrs> {
  private loading: boolean;

  oninit() {
    this.loading = false;
  }

  view(vnode: ResultNode<InviteButtonAttrs>) {
    const {
      selection,
      successCallback,
      failureCallback,
      invitedAddress,
      invitedEmail,
      invitedAddressChain,
      chain,
      disabled,
    } = vnode.attrs;

    return (
      <CWButton
        disabled={disabled}
        label={selection === 'email' ? 'Send Invite' : 'Add address'}
        onClick={(e) => {
          e.preventDefault();
          const address = invitedAddress;
          const emailAddress = invitedEmail;
          const selectedChain = invitedAddressChain;

          if (selection !== 'address' && selection !== 'email') {
            return;
          }

          if (selection === 'address' && (address === '' || address === null)) {
            return;
          }

          if (
            selection === 'email' &&
            (emailAddress === '' || emailAddress === null)
          ) {
            return;
          }

          this.loading = true;
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

          const chainOrCommunityObj = chain ? { chain: chain.id } : null;

          if (!chainOrCommunityObj) return;

          $.post(app.serverUrl() + postType, {
            address: app.user.activeAccount.address,
            ...chainOrCommunityObj,
            invitedAddress: selection === 'address' ? address : '',
            invitedAddressChain: selection === 'address' ? selectedChain : '',
            invitedEmail: selection === 'email' ? emailAddress : '',
            auth: true,
            jwt: app.user.jwt,
          }).then(
            (response) => {
              this.loading = false;
              if (response.status === 'Success') {
                successCallback(true);
                if (postType === '/addMember') {
                  const { result } = response;
                  app.roles.addRole(
                    new RoleInfo(
                      result.id,
                      result.address_id,
                      result.address,
                      result.address_chain,
                      result.chain_id,
                      result.permission,
                      result.allow,
                      result.deny,
                      result.is_user_default
                    )
                  );
                }
              } else {
                failureCallback(true, response.message);
              }
              redraw();
            },
            (err) => {
              failureCallback(true, err.responseJSON.error);
              this.loading = false;
              redraw();
            }
          );
        }}
      />
    );
  }
}

type CreateInviteModalAttrs = {
  chainInfo?: ChainInfo;
};

export class CreateInviteModal extends ClassComponent<CreateInviteModalAttrs> {
  private closeResults: () => void;
  private disabled: boolean;
  private enterAddress: (address: string) => void;
  private error: string;
  private errorText: string;
  private failure: boolean;
  private hideResults: boolean;
  private inputTimeout: any;
  private invitedAddressChain: string;
  private invitedEmail: string;
  private isAddressValid: boolean;
  private isTyping: boolean; // only monitors address search
  private newAddressToValidate: boolean;
  private results: any[];
  private searchAddressTerm: string;
  private success: boolean;

  view(vnode: ResultNode<CreateInviteModalAttrs>) {
    const { chainInfo } = vnode.attrs;

    const chainOrCommunityObj = chainInfo ? { chain: chainInfo } : null;

    if (!chainOrCommunityObj) return;

    const selectedChainId =
      this.invitedAddressChain ||
      (chainInfo ? chainInfo.id : app.config.chains.getAll()[0].id);

    const selectedChain = app.config.chains.getById(selectedChainId);

    if (this.isTyping) {
      this.isAddressValid = false;
    }

    if (
      this.searchAddressTerm?.length > 0 &&
      !this.isTyping &&
      this.newAddressToValidate
    ) {
      if (selectedChain?.base === ChainBase.Substrate) {
        try {
          decodeAddress(this.searchAddressTerm);
          this.isAddressValid = true;
        } catch (e) {
          console.log(e);
        }
      } else if (selectedChain?.base === ChainBase.Ethereum) {
        this.isAddressValid = checkAddressChecksum(this.searchAddressTerm);
      } else {
        // TODO: check Cosmos & Near?
      }

      this.newAddressToValidate = false;
    }

    const isEmailValid = validateEmail(this.invitedEmail);

    const { results, searchAddressTerm } = this;

    this.closeResults = () => {
      this.hideResults = true;
    };

    this.enterAddress = (address: string) => {
      this.searchAddressTerm = address;
      this.newAddressToValidate = true;
    };

    return (
      <div className="CreateInviteModal">
        <div className="compact-modal-title">
          <h3>Invite members</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <div className="community-and-address-row">
            <div className="community-select-container">
              <CWLabel label="Community" />
              {/* {m(SelectList, { // @TODO @REACT FIX ME
                closeOnSelect: true,
                items: chainInfo
                  ? [{ label: chainInfo.name, value: chainInfo.id }]
                  : app.config.chains
                      .getAll()
                      .map((chain) => ({
                        label: chain.name.toString(),
                        value: chain.id.toString(),
                      }))
                      .sort((a: CommunityOption, b: CommunityOption) => {
                        if (a.label > b.label) return 1;
                        if (a.label < b.label) return -1;
                        return 0;
                      }),
                itemRender: (item: CommunityOption) =>
                  render(ListItem, {
                    label: item.label,
                    selected:
                      this.invitedAddressChain &&
                      this.invitedAddressChain === item.value,
                  }),
                itemPredicate: (query: string, item: CommunityOption) =>
                  item.label.toLowerCase().includes(query.toLowerCase()),
                onSelect: (item: CommunityOption) => {
                  this.invitedAddressChain = item.value;
                },
                loading: false,
                popoverAttrs: {
                  hasArrow: false,
                },
                trigger: (
                  <CWButton
                    iconLeft="chevronDown"
                    buttonType="lg-secondary-blue"
                    label={selectedChainId}
                  />
                ),
                emptyContent: 'No communities found',
                inputAttrs: {
                  placeholder: 'Search Community...',
                },
                checkmark: false,
              })} */}
            </div>
            <CWTextInput
              label="Address"
              placeholder="Type to search by name or address"
              value={this.searchAddressTerm}
              onInput={(e) => {
                e.stopPropagation();
                this.isTyping = true;
                this.searchAddressTerm = e.target.value?.toLowerCase();
                if (this.hideResults) {
                  this.hideResults = false;
                }
                if (!app.searchAddressCache[this.searchAddressTerm]) {
                  app.searchAddressCache[this.searchAddressTerm] = {
                    loaded: false,
                  };
                }
                if (e.target.value?.length > 3) {
                  const params: SearchParams = {
                    communityScope: null,
                    chainScope:
                      this.invitedAddressChain ||
                      (chainInfo
                        ? chainInfo.id
                        : app.config.chains.getAll()[0].id),
                  };
                  clearTimeout(this.inputTimeout);
                  this.inputTimeout = setTimeout(() => {
                    this.isTyping = false;
                    return search(this.searchAddressTerm, params, this);
                  }, 500);
                }
              }}
            />
          </div>
          {searchAddressTerm?.length > 3 && !this.hideResults && null // @TODO @REACT FIX ME
          // m(List, [
          //   !results || results?.length === 0
          //     ? app.searchAddressCache[searchAddressTerm]?.loaded
          //       ? m(ListItem, {
          //           label: (
          //             <div className="no-addresses">
          //               <CWText fontWeight="medium">
          //                 {searchAddressTerm}
          //               </CWText>
          //               <CWText type="caption">No addresses found</CWText>
          //             </div>
          //           ),
          //           onClick: () => {
          //             if (searchAddressTerm.length < 4) {
          //               notifyError('Query must be at least 4 characters');
          //             }
          //           },
          //         })
          //       : m(ListItem, { label: <CWSpinner size="small" /> })
          //     : this.isTyping
          //     ? m(ListItem, { label: <CWSpinner size="small" /> })
          //     : results,
          // ])
          }
          <InviteButton
            selection="address"
            disabled={!this.isAddressValid}
            successCallback={(v: boolean) => {
              this.success = v;
              this.searchAddressTerm = '';
              redraw();
            }}
            failureCallback={(v: boolean, err?: string) => {
              this.failure = v;
              if (err) this.error = err;
              redraw();
            }}
            invitedAddress={this.searchAddressTerm}
            invitedAddressChain={selectedChainId}
            {...chainOrCommunityObj}
          />
          <CWTextInput
            label="Email"
            placeholder="Enter email"
            onInput={(e) => {
              this.invitedEmail = (e.target as any).value;
            }}
          />
          <InviteButton
            selection="email"
            disabled={!isEmailValid}
            successCallback={(v: boolean) => {
              this.success = v;
              this.invitedEmail = '';
              redraw();
            }}
            failureCallback={(v: boolean, err?: string) => {
              this.failure = v;
              if (err) this.error = err;
              redraw();
            }}
            invitedEmail={this.invitedEmail}
            {...chainOrCommunityObj}
          />
          {this.success && (
            <div className="success-message">Success! Your invite was sent</div>
          )}
          {this.failure && (
            <div className="error-message">
              {this.error || 'An error occurred'}
            </div>
          )}
        </div>
      </div>
    );
  }
}
