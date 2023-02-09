import React from 'react';

import { ClassComponent, ResultNode, redraw} from

 'mithrilInterop';

import 'modals/edit_collaborators_modal.scss';

import { Thread, Profile } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

import 'modals/edit_collaborators_modal.scss';

import app from 'state';
import { User } from '../components/user/user';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';

type EditCollaboratorsModalAttrs = {
  thread: Thread;
};

export class EditCollaboratorsModal extends ClassComponent<EditCollaboratorsModalAttrs> {
  private addedEditors: any;
  private items: any[];
  private membersFetched: boolean;
  private removedEditors: any;
  private searchTerm: string;

  view(vnode: ResultNode<EditCollaboratorsModalAttrs>) {
    const { thread } = vnode.attrs;

    const fetchMembers = async (searchTerm) => {
      if (searchTerm.length < 3) {
        return;
      }
      const chainOrCommObj = {
        chain: app.activeChainId(),
        searchTerm,
      };

      await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj)
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
    };

    if (!this.membersFetched) {
      this.items = [];
      fetchMembers('');
      this.membersFetched = true;
    }

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
            {/* @TODO @REACT FIX ME */}
            {/*<div className="selected-collaborators-section">*/}
            {/*  <CWTextInput*/}
            {/*    label="Search Members"*/}
            {/*    value={this.searchTerm}*/}
            {/*    placeholder="type 3 or more characters to search"*/}
            {/*    oninput={async (e) => {*/}
            {/*      this.searchTerm = e.target.value;*/}
            {/*      await fetchMembers(this.searchTerm);*/}
            {/*    }}*/}
            {/*  />*/}
            {/*  <div className="collaborator-rows-container">*/}
            {/*    {items.map((c) => {*/}
            {/*      const user: Profile = app.profiles.getProfile(*/}
            {/*        c.chain_id,*/}
            {/*        c.Address.address*/}
            {/*      );*/}

            {/*      return (*/}
            {/*        <div*/}
            {/*          class="collaborator-row"*/}
            {/*          onclick={async () => {*/}
            {/*            const addrItem = (c as any).Address;*/}

            {/*            // If already scheduled for removal, un-schedule*/}
            {/*            if (this.removedEditors[addrItem.address]) {*/}
            {/*              delete this.removedEditors[addrItem.address];*/}
            {/*            }*/}

            {/*            // If already scheduled for addition, un-schedule*/}
            {/*            if (this.addedEditors[addrItem.address]) {*/}
            {/*              delete this.addedEditors[addrItem.address];*/}
            {/*            } else if (*/}
            {/*              thread.collaborators.filter((collaborator) => {*/}
            {/*                return (*/}
            {/*                  collaborator.address === addrItem.address &&*/}
            {/*                  collaborator.chain === addrItem.chain*/}
            {/*                );*/}
            {/*              }).length === 0*/}
            {/*            ) {*/}
            {/*              // If unscheduled for addition, and not an existing editor, schedule*/}
            {/*              this.addedEditors[addrItem.address] = addrItem;*/}
            {/*            } else {*/}
            {/*              notifyInfo('Already an editor');*/}
            {/*            }*/}
            {/*          }}*/}
            {/*        >*/}
            {/*          {m(User, {*/}
            {/*            user,*/}
            {/*          })}*/}
            {/*        </div>*/}
            {/*      );*/}
            {/*    })}*/}
            {/*  </div>*/}
            {/*</div>*/}
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
