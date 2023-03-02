import React, { useEffect, useState } from 'react';
import axios from 'axios';
import $ from 'jquery';

import 'modals/edit_collaborators_modal.scss';

import type { Thread } from 'models';
import type { IThreadCollaborator } from '/models/Thread';
import type { RoleInstanceWithPermissionAttributes } from 'server/util/roles';

import app from 'state';
import { User } from '../components/user/user';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { CWTextInput } from '../components/component_kit/cw_text_input';

type EditCollaboratorsModalProps = {
  onModalClose: () => void;
  thread: Thread;
};

export const EditCollaboratorsModal = ({
  onModalClose,
  thread,
}: EditCollaboratorsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<RoleInstanceWithPermissionAttributes>
  >([]);
  const [collaborators, setCollaborators] = useState<
    Array<IThreadCollaborator>
  >(thread.collaborators);

  console.log('searchResults', searchResults);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(`${app.serverUrl()}/bulkMembers`, {
          params: {
            chain: app.activeChainId(),
            searchTerm,
          },
        });

        if (response.data.status !== 'Success') {
          throw new Error('Could not fetch members');
        } else {
          const results: Array<RoleInstanceWithPermissionAttributes> =
            response.data.result.filter(
              (role: RoleInstanceWithPermissionAttributes) =>
                role.Address.address !== app.user.activeAccount?.address
            );

          setSearchResults(results);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (searchTerm.length >= 3) {
      fetchMembers();
    }
  }, [searchTerm]);

  return (
    <div className="EditCollaboratorsModal">
      <div className="compact-modal-title">
        <h3>Edit collaborators</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <div className="user-list-container">
          <div className="selected-collaborators-section">
            <CWTextInput
              label="Search Members"
              value={searchTerm}
              placeholder="type 3 or more characters to search"
              onInput={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
            <div className="collaborator-rows-container">
              {searchResults.map((c, i) => (
                <div
                  key={i}
                  className="collaborator-row"
                  onClick={() => {
                    // If already scheduled for removal, un-schedule
                    // if (removedEditors[c.Address.address]) {
                    //   delete removedEditors[c.Address.address];
                    // }
                    // // If already scheduled for addition, un-schedule
                    // if (addedEditors[c.Address.address]) {
                    //   delete addedEditors[c.Address.address];
                    // } else if (
                    //   thread.collaborators.filter((collaborator) => {
                    //     return (
                    //       collaborator.address === c.Address.address &&
                    //       collaborator.chain === c.Address.chain
                    //     );
                    //   }).length === 0
                    // ) {
                    //   // If unscheduled for addition, and not an existing editor, schedule
                    //   addedEditors[c.Address.address] = c;
                    // } else {
                    //   notifyInfo('Already an editor');
                    // }
                  }}
                >
                  <User
                    user={app.profiles.getProfile(
                      c.chain_id,
                      c.Address.address
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {collaborators.length > 0 ? (
          <div className="selected-collaborators-section">
            <CWLabel label="Selected collaborators" />
            <div className="collaborator-rows-container">
              {collaborators.map((c, i) => {
                return (
                  <div key={i} className="collaborator-row">
                    <User user={app.profiles.getProfile(c.chain, c.address)} />
                    <CWIconButton
                      iconName="close"
                      iconSize="small"
                      onClick={() => {
                        // If already scheduled for addition, un-schedule
                        // if (addedEditors[c.address]) {
                        //   delete addedEditors[c.address];
                        // } else {
                        //   // If already an existing editor, schedule for removal
                        //   removedEditors[c.address] = c;
                        // }
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
            onClick={onModalClose}
          />
          <CWButton
            disabled={
              thread.collaborators === collaborators
              // check deep equality
            }
            label="Save changes"
            onClick={async () => {
              if (!$.isEmptyObject(addedEditors)) {
                try {
                  // TODO Graham 4/4/22: Break off into proper controller methods
                  const response = await axios.post(
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
                  const { status, result } = response.data;
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
                  const response = await axios.post(
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
                  const { status, result } = response.data;
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
