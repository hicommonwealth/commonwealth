import { notifyError, notifySuccess } from 'controllers/app/notifications';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { isEqual } from 'lodash';
import 'modals/edit_collaborators_modal.scss';
import React, { useState } from 'react';
import type { RoleInstanceWithPermissionAttributes } from 'server/util/roles';
import app from 'state';
import { useEditThreadMutation } from 'state/api/threads';
import { useDebounce } from 'usehooks-ts';
import type Thread from '../../models/Thread';
import type { IThreadCollaborator } from '../../models/Thread';
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

interface IThreadCollaboratorWithId extends IThreadCollaborator {
  id: number;
}

export const EditCollaboratorsModal = ({
  onModalClose,
  thread,
  onCollaboratorsUpdated,
}: EditCollaboratorsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const { mutateAsync: editThread } = useEditThreadMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic.id,
  });

  const [searchResults, setSearchResults] = useState<
    Array<RoleInstanceWithPermissionAttributes>
  >([]);
  const [collaborators, setCollaborators] = useState<
    Array<IThreadCollaboratorWithId>
  >(thread.collaborators as any);

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

  const handleUpdateCollaborators = (c: IThreadCollaboratorWithId) => {
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
                      id: c.Address.id,
                      address: c.Address.address,
                      chain: c.Address.chain,
                    })
                  }
                >
                  <User
                    userAddress={c.Address.address}
                    userChainId={c.chain_id}
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
                  <User userAddress={c.address} userChainId={c.chain} />
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
              const newCollaborators = collaborators.filter(
                (c1) =>
                  !thread.collaborators.some((c2) => c1.address === c2.address)
              );
              const removedCollaborators = (thread.collaborators as any).filter(
                (c1) => !collaborators.some((c2) => c1.address === c2.address)
              );

              if (
                newCollaborators.length > 0 ||
                removedCollaborators.length > 0
              ) {
                try {
                  const updatedThread = await editThread({
                    threadId: thread.id,
                    chainId: app.activeChainId(),
                    address: app.user.activeAccount.address,
                    collaborators: {
                      ...(newCollaborators.length > 0 && {
                        toAdd: newCollaborators.map((x) => x.id),
                      }),
                      ...(removedCollaborators.length > 0 && {
                        toRemove: removedCollaborators.map((x) => x.id),
                      }),
                    },
                  });
                  notifySuccess('Collaborators updated');
                  onCollaboratorsUpdated &&
                    onCollaboratorsUpdated(updatedThread.collaborators);
                } catch (err) {
                  const error =
                    err?.responseJSON?.error ||
                    'Failed to update collaborators';
                  notifyError(error);
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
