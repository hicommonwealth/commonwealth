import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { isEqual } from 'lodash';

import 'modals/edit_collaborators_modal.scss';

import type { IThreadCollaborator } from '../../models/Thread';
import type Thread from '../../models/Thread';
import type { RoleInstanceWithPermissionAttributes } from 'server/util/roles';

import app from 'state';
import { User } from '../components/user/user';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { useDebounce } from 'usehooks-ts';
import MinimumProfile from 'client/scripts/models/MinimumProfile';

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
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const [searchResults, setSearchResults] = useState<
    Array<RoleInstanceWithPermissionAttributes>
  >([]);
  const [collaborators, setCollaborators] = useState<
    Array<IThreadCollaborator>
  >(thread.collaborators);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await app.search.searchMentionableProfiles(
          debouncedSearchTerm,
          app.activeChainId(),
          30,
          1,
          true
        );

        const results: Array<RoleInstanceWithPermissionAttributes> =
          response.profiles
            .map((profile) => ({
              ...profile.roles[0],
              Address: profile.addresses[0],
            }))
            .filter(
              (role) => role.Address.address !== app.user.activeAccount?.address
            );

        setSearchResults(results);
      } catch (err) {
        console.error(err);
      }
    };

    if (debouncedSearchTerm.length >= 3) {
      fetchMembers();
    } else if (debouncedSearchTerm.length === 0) {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

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
