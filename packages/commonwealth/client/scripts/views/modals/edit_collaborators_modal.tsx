import React, { useState } from 'react';

import 'modals/edit_collaborators_modal.scss';

import type { Thread, Profile } from 'models';

import app from 'state';
import { User } from '../components/user/user';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

type EditCollaboratorsModalProps = {
  onModalClose: () => void;
  thread: Thread;
};

export const EditCollaboratorsModal = ({
  onModalClose,
  thread,
}: EditCollaboratorsModalProps) => {
  const [addedEditors, setAddedEditors] = useState({});
  const [items, setItems] = useState([]);
  const [membersFetched, setMembersFetched] = useState(false);
  const [removedEditors, setRemovedEditors] = useState({});
  const [searchTerm, setSearchTerm] = useState();

  const fetchMembers = async (_searchTerm: string) => {
    if (_searchTerm.length < 3) {
      return;
    }
    const chainOrCommObj = {
      chain: app.activeChainId(),
      _searchTerm,
    };

    await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj)
      .then((response) => {
        if (response.status !== 'Success')
          throw new Error('Could not fetch members');
        setItems(
          response.result.filter(
            (role) => role.Address.address !== app.user.activeAccount?.address
          )
        );
      })
      .catch((err) => {
        console.error(err);
      });
  };

  if (!membersFetched) {
    setItems([]);
    fetchMembers('');
    setMembersFetched(true);
  }

  if (!addedEditors) {
    setAddedEditors({});
  }

  if (!removedEditors) {
    setRemovedEditors({});
  }

  const allCollaborators = thread.collaborators
    .concat(Object.values(addedEditors))
    .filter((c) => !Object.keys(removedEditors).includes(c.address));

  return (
    <div className="EditCollaboratorsModal">
      <div className="compact-modal-title">
        <h3>Edit collaborators</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <div className="user-list-container">
          {/* @TODO @REACT FIX ME */}
          {/*<div className="selected-collaborators-section">*/}
          {/*  <CWTextInput*/}
          {/*    label="Search Members"*/}
          {/*    value={searchTerm}*/}
          {/*    placeholder="type 3 or more characters to search"*/}
          {/*    oninput={async (e) => {*/}
          {/*      searchTerm = e.target.value;*/}
          {/*      await fetchMembers(searchTerm);*/}
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
          {/*            if (removedEditors[addrItem.address]) {*/}
          {/*              delete removedEditors[addrItem.address];*/}
          {/*            }*/}

          {/*            // If already scheduled for addition, un-schedule*/}
          {/*            if (addedEditors[addrItem.address]) {*/}
          {/*              delete addedEditors[addrItem.address];*/}
          {/*            } else if (*/}
          {/*              thread.collaborators.filter((collaborator) => {*/}
          {/*                return (*/}
          {/*                  collaborator.address === addrItem.address &&*/}
          {/*                  collaborator.chain === addrItem.chain*/}
          {/*                );*/}
          {/*              }).length === 0*/}
          {/*            ) {*/}
          {/*              // If unscheduled for addition, and not an existing editor, schedule*/}
          {/*              addedEditors[addrItem.address] = addrItem;*/}
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
                        if (addedEditors[c.address]) {
                          delete addedEditors[c.address];
                        } else {
                          // If already an existing editor, schedule for removal
                          removedEditors[c.address] = c;
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
            onClick={() => {
              onModalClose();
            }}
          />
          <CWButton
            disabled={
              $.isEmptyObject(addedEditors) && $.isEmptyObject(removedEditors)
            }
            label="Save changes"
            onClick={async (e) => {
              if (!$.isEmptyObject(addedEditors)) {
                try {
                  // TODO Graham 4/4/22: Break off into proper controller methods
                  const response = await $.post(
                    `${app.serverUrl()}/addEditors`,
                    {
                      address: app.user.activeAccount.address,
                      author_chain: app.user.activeAccount.chain.id,
                      chain: app.activeChainId(),
                      thread_id: thread.id,
                      editors: JSON.stringify(addedEditors),
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

              if (!$.isEmptyObject(removedEditors)) {
                try {
                  const response = await $.post(
                    `${app.serverUrl()}/deleteEditors`,
                    {
                      address: app.user.activeAccount.address,
                      author_chain: app.user.activeAccount.chain.id,
                      chain: app.activeChainId(),
                      thread_id: thread.id,
                      editors: JSON.stringify(removedEditors),
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
                } catch (err) {
                  const errMsg =
                    err.responseJSON?.error || 'Failed to remove collaborators';
                  notifyError(errMsg);
                }
              }

              onModalClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
