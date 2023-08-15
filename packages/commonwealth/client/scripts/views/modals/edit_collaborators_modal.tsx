import React, { useState } from 'react';
import { isEqual } from 'lodash';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import type { RoleInstanceWithPermissionAttributes } from 'server/util/roles';
import app from 'state';
import {
  useAddThreadCollaboratorsMutation,
  useDeleteThreadCollaboratorsMutation,
} from 'state/api/threads';
import { useDebounce } from 'usehooks-ts';
import NewProfilesController from '../../controllers/server/newProfiles';
import type Thread from '../../models/Thread';
import type { IThreadCollaborator } from '../../models/Thread';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { User } from '../components/user/user';

import 'modals/edit_collaborators_modal.scss';
import { CWModalHeader } from './CWModalHeader';

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

  const { mutateAsync: addThreadCollaborators } =
    useAddThreadCollaboratorsMutation({
      chainId: app.activeChainId(),
      threadId: thread.id,
    });

  const { mutateAsync: deleteThreadCollaborators } =
    useDeleteThreadCollaboratorsMutation({
      chainId: app.activeChainId(),
      threadId: thread.id,
    });

  const [searchResults, setSearchResults] = useState<
    Array<RoleInstanceWithPermissionAttributes>
  >([]);
  const [collaborators, setCollaborators] = useState<
    Array<IThreadCollaborator>
  >(thread.collaborators);

  useNecessaryEffect(() => {
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
          response.results
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
      <CWModalHeader label="Edit collaborators" onModalClose={onModalClose} />
      <div className="compact-modal-body">
        <>body section</>
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
                    user={NewProfilesController.Instance.getProfile(
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
                  <User
                    user={NewProfilesController.Instance.getProfile(
                      c.chain,
                      c.address
                    )}
                  />
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
            buttonType="secondary"
            buttonHeight="sm"
            onClick={onModalClose}
          />
          <CWButton
            disabled={isEqual(thread.collaborators, collaborators)}
            label="Save changes"
            buttonType="primary"
            buttonHeight="sm"
            onClick={async () => {
              const newCollaborators = collaborators.filter(
                (c1) =>
                  !thread.collaborators.some((c2) => c1.address === c2.address)
              );

              if (newCollaborators.length > 0) {
                try {
                  const updatedCollaborators = await addThreadCollaborators({
                    threadId: thread.id,
                    newCollaborators: newCollaborators,
                    chainId: app.activeChainId(),
                    address: app.user.activeAccount.address,
                  });
                  notifySuccess('Collaborators added');
                  onCollaboratorsUpdated &&
                    onCollaboratorsUpdated(updatedCollaborators);
                } catch (err) {
                  const error =
                    err?.responseJSON?.error || 'Failed to add collaborators';
                  notifyError(error);
                }
              }

              const removedCollaborators = thread.collaborators.filter(
                (c1) => !collaborators.some((c2) => c1.address === c2.address)
              );

              if (removedCollaborators.length > 0) {
                try {
                  const updatedCollaborators = await deleteThreadCollaborators({
                    threadId: thread.id,
                    updatedCollaborators: removedCollaborators,
                    chainId: app.activeChainId(),
                    address: app.user.activeAccount.address,
                  });
                  notifySuccess('Collaborators removed');
                  onCollaboratorsUpdated &&
                    onCollaboratorsUpdated(updatedCollaborators);
                } catch (err) {
                  const errMsg =
                    err?.responseJSON?.error ||
                    'Failed to remove collaborators';
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
