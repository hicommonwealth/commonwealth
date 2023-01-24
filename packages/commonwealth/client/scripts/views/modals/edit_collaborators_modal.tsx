/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import $ from 'jquery';
// import { QueryList, ListItem } from 'construct-ui';

import 'modals/edit_collaborators_modal.scss';

import app from 'state';
import { Thread, Profile } from 'models';
import { User } from 'views/components/user/user';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { CWButton } from '../components/component_kit/cw_button';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';

type EditCollaboratorsModalAttrs = {
  thread: Thread;
};

export class EditCollaboratorsModal extends ClassComponent<EditCollaboratorsModalAttrs> {
  private addedEditors: any;
  private items: any[];
  private membersFetched: boolean;
  private removedEditors: any;

  view(vnode: ResultNode<EditCollaboratorsModalAttrs>) {
    const { thread } = vnode.attrs;

    // TODO Graham 4/4/21: We should begin developing boilerplate around fetching toggles, state
    if (!this.membersFetched) {
      this.membersFetched = true;
      const chainOrCommObj = { chain: app.activeChainId() };

      // TODO Graham 4/4/21: This needs pagination, search, or serializing.
      // The fetch time for large communities is getting unwieldy.
      $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj)
        .then((response) => {
          if (response.status !== 'Success')
            throw new Error('Could not fetch members');
          this.items = response.result.filter((role) => {
            return role.Address.address !== app.user.activeAccount?.address;
          });
          redraw();
        })
        .catch((err) => {
          redraw();
          console.error(err);
        });
    }

    if (!this.items?.length) return;

    if (!this.addedEditors) {
      this.addedEditors = {};
    }

    if (!this.removedEditors) {
      this.removedEditors = {};
    }

    const { items } = this;

    const allCollaborators = thread.collaborators
      .concat(Object.values(this.addedEditors))
      .filter((c) => !Object.keys(this.removedEditors).includes(c.address));

    return (
      <div className="EditCollaboratorsModal">
        <div className="compact-modal-title">
          <h3>Edit collaborators</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <div className="user-list-container">
            <CWLabel label="Users" />
            {/* {m(QueryList, { // @TODO @REACT FIX ME
              checkmark: true,
              items,
              inputAttrs: {
                placeholder: 'Enter username or address...',
              },
              itemRender: (role: any) => {
                const user: Profile = app.profiles.getProfile(
                  role.Address.chain,
                  role.Address.address
                );

                const recentlyAdded = !$.isEmptyObject(
                  this.addedEditors[role.Address.address]
                );

                return m(ListItem, {
                  label: <User user={user} />,
                  selected: recentlyAdded,
                  key: role.Address.address,
                });
              },
              itemPredicate: (query, item) => {
                const address = (item as any).Address;

                return address.name
                  ? address.name.toLowerCase().includes(query.toLowerCase())
                  : address.address.toLowerCase().includes(query.toLowerCase());
              },
              onSelect: (item) => {
                const addrItem = (item as any).Address;

                // If already scheduled for removal, un-schedule
                if (this.removedEditors[addrItem.address]) {
                  delete this.removedEditors[addrItem.address];
                }

                // If already scheduled for addition, un-schedule
                if (this.addedEditors[addrItem.address]) {
                  delete this.addedEditors[addrItem.address];
                } else if (
                  thread.collaborators.filter((c) => {
                    return (
                      c.address === addrItem.address &&
                      c.chain === addrItem.chain
                    );
                  }).length === 0
                ) {
                  // If unscheduled for addition, and not an existing editor, schedule
                  this.addedEditors[addrItem.address] = addrItem;
                } else {
                  notifyInfo('Already an editor');
                }
              },
            })} */}
          </div>
          {allCollaborators.length > 0 ? (
            <div className="selected-collaborators-section">
              <CWLabel label="Selected collaborators" />
              <div className="collaborator-rows-container">
                {allCollaborators.map((c) => {
                  const user: Profile = app.profiles.getProfile(
                    c.chain,
                    c.address
                  );

                  return (
                    <div className="collaborator-row">
                      <User user={user} />
                      <CWIconButton
                        iconName="close"
                        iconSize="small"
                        onClick={async () => {
                          // If already scheduled for addition, un-schedule
                          if (this.addedEditors[c.address]) {
                            delete this.addedEditors[c.address];
                          } else {
                            // If already an existing editor, schedule for removal
                            this.removedEditors[c.address] = c;
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-collaborators">
              <CWText className="no-collaborators-text">
                No collaborators selected
              </CWText>
            </div>
          )}
          <div className="buttons-row">
            <CWButton
              label="Cancel"
              buttonType="secondary-blue"
              onClick={(e) => {
                $(e.target).trigger('modalexit');
              }}
            />
            <CWButton
              disabled={
                $.isEmptyObject(this.addedEditors) &&
                $.isEmptyObject(this.removedEditors)
              }
              label="Save changes"
              onClick={async (e) => {
                if (!$.isEmptyObject(this.addedEditors)) {
                  try {
                    // TODO Graham 4/4/22: Break off into proper controller methods
                    const response = await $.post(
                      `${app.serverUrl()}/addEditors`,
                      {
                        address: app.user.activeAccount.address,
                        author_chain: app.user.activeAccount.chain.id,
                        chain: app.activeChainId(),
                        thread_id: thread.id,
                        editors: JSON.stringify(this.addedEditors),
                        jwt: app.user.jwt,
                      }
                    );
                    const { status, result } = response;
                    if (status === 'Success') {
                      thread.collaborators = result.collaborators;
                      notifySuccess('Collaborators added');
                    } else {
                      notifyError('Failed to add collaborators');
                    }
                  } catch (err) {
                    throw new Error(
                      err.responseJSON && err.responseJSON.error
                        ? err.responseJSON.error
                        : 'Failed to add collaborators'
                    );
                  }
                }

                if (!$.isEmptyObject(this.removedEditors)) {
                  try {
                    const response = await $.post(
                      `${app.serverUrl()}/deleteEditors`,
                      {
                        address: app.user.activeAccount.address,
                        author_chain: app.user.activeAccount.chain.id,
                        chain: app.activeChainId(),
                        thread_id: thread.id,
                        editors: JSON.stringify(this.removedEditors),
                        jwt: app.user.jwt,
                      }
                    );
                    const { status, result } = response;
                    if (status === 'Success') {
                      thread.collaborators = result.collaborators;
                      notifySuccess('Collaborators removed');
                    } else {
                      throw new Error('Failed to remove collaborators');
                    }
                    redraw();
                  } catch (err) {
                    const errMsg =
                      err.responseJSON?.error ||
                      'Failed to remove collaborators';
                    notifyError(errMsg);
                  }
                }

                $(e.target).trigger('modalexit');
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
