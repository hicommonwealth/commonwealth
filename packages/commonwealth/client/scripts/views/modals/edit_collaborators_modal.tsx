import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { isEqual } from 'lodash';

import 'modals/edit_collaborators_modal.scss';
import type Thread, { IThreadCollaborator } from 'models/Thread';
import React, { useEffect, useState } from 'react';
import type { RoleInstanceWithPermissionAttributes } from 'server/util/roles';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { User } from '../components/user/user';

type EditCollaboratorsModalProps = {
  onModalClose: () => void;
  thread: Thread;
  onCollaboratorsUpdated: (newEditors: IThreadCollaborator[]) => void;
};

export const EditCollaboratorsModal = ({
  onModalClose,
  thread,
  onCollaboratorsUpdated,
}: EditCollaboratorsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<RoleInstanceWithPermissionAttributes>
  >([]);
  const [collaborators, setCollaborators] = useState<
    Array<IThreadCollaborator>
  >(thread.collaborators);

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
    } else if (searchTerm.length === 0) {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleUpdateCollaborators = (c: IThreadCollaborator) => {
    const updated = collaborators.find((_c) => _c.address === c.address)
      ? collaborators.filter((_c) => _c.address !== c.address)
      : collaborators.concat([c]);

    setCollaborators(updated);
  };

  return (
    <div className="EditCollaboratorsModal">
      <div className="compact-modal-title">
        <h3>Edit collaborators</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <div className="section">
          <CWTextInput
            label="Search Members"
            value={searchTerm}
            placeholder="Type 3 or more characters to search"
            onInput={(e) => {
              setSearchTerm(e.target.value);
            }}
            iconRight={searchTerm.length > 0 ? 'close' : undefined}
            iconRightonClick={() => setSearchTerm('')}
          />
          <div className="collaborator-rows-container">
            {searchResults.length > 0 ? (
              searchResults.map((c, i) => (
                <div
                  key={i}
                  className="collaborator-row"
                  onClick={() =>
                    handleUpdateCollaborators({
                      address: c.Address.address,
                      chain: c.Address.chain,
                    })
                  }
                >
                  <User
                    user={app.newProfiles.getProfile(
                      c.chain_id,
                      c.Address.address
                    )}
                  />
                </div>
              ))
            ) : (
              <div className="no-collaborators">
                <CWText className="no-collaborators-text">
                  No search results
                </CWText>
              </div>
            )}
          </div>
        </div>
        <div className="section">
          <CWLabel label="Selected collaborators" />
          {collaborators.length > 0 ? (
            <div className="collaborator-rows-container">
              {collaborators.map((c, i) => (
                <div key={i} className="collaborator-row">
                  <User user={app.newProfiles.getProfile(c.chain, c.address)} />
                  <CWIconButton
                    iconName="close"
                    iconSize="small"
                    onClick={() => handleUpdateCollaborators(c)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-collaborators">
              <CWText className="no-collaborators-text">
                No collaborators selected
              </CWText>
            </div>
          )}
        </div>
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onModalClose}
          />
          <CWButton
            disabled={isEqual(thread.collaborators, collaborators)}
            label="Save changes"
            onClick={async () => {
              const added = collaborators.filter(
                (c1) =>
                  !thread.collaborators.some((c2) => c1.address === c2.address)
              );

              if (added.length > 0) {
                try {
                  const response = await axios.post(
                    `${app.serverUrl()}/addEditors`,
                    {
                      address: app.user.activeAccount.address,
                      author_chain: app.user.activeAccount.chain.id,
                      chain: app.activeChainId(),
                      thread_id: thread.id,
                      editors: added,
                      jwt: app.user.jwt,
                    }
                  );

                  if (response.data.status === 'Success') {
                    notifySuccess('Collaborators added');
                    onCollaboratorsUpdated(response.data.result.collaborators);
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

              const deleted = thread.collaborators.filter(
                (c1) => !collaborators.some((c2) => c1.address === c2.address)
              );

              if (deleted.length > 0) {
                try {
                  const response = await axios.post(
                    `${app.serverUrl()}/deleteEditors`,
                    {
                      address: app.user.activeAccount.address,
                      author_chain: app.user.activeAccount.chain.id,
                      chain: app.activeChainId(),
                      thread_id: thread.id,
                      editors: deleted,
                      jwt: app.user.jwt,
                    }
                  );

                  if (response.data.status === 'Success') {
                    notifySuccess('Collaborators removed');
                    onCollaboratorsUpdated(response.data.result.collaborators);
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
