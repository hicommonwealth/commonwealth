import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useDeleteGroupMutation } from 'state/api/groups';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './DeleteGroupModal.scss';

type DeleteGroupModalAttrs = {
  groupId: number;
  groupName: string;
  gatedTopics: string[];
  onClose?: () => any;
  isOpen: boolean;
};

export const DeleteGroupModal = ({
  groupId,
  groupName,
  gatedTopics,
  isOpen,
  onClose = () => {},
}: DeleteGroupModalAttrs) => {
  const navigate = useCommonNavigate();
  const { mutateAsync: deleteGroup } = useDeleteGroupMutation({
    communityId: app.activeChainId(),
  });

  const handleDelete = async () => {
    await deleteGroup({
      address: app.user.activeAccount.address,
      communityId: app.activeChainId(),
      groupId: groupId,
    })
      .then(() => {
        notifySuccess('Group deleted');
        navigate('/members?tab=groups');
      })
      .catch(() => {
        notifyError('Failed to delete group');
      })
      .finally(onClose);
  };

  return (
    <CWModal
      size="large"
      content={
        <div className="DeleteGroupModal">
          <CWModalHeader
            label={`Are you sure you want to delete group ${groupName}`}
            icon="danger"
            onModalClose={onClose}
          />
          <CWModalBody>
            <CWText>
              By deleting this group you will be un-gating topics{' '}
              {gatedTopics.join(', ')}. This means that members will no longer
              need to meet the specified requirements within this group in order
              to interact said topics.
            </CWText>
          </CWModalBody>
          <CWModalFooter>
            <CWButton
              label="Cancel"
              buttonType="secondary"
              onClick={onClose}
              buttonHeight="sm"
            />
            <CWButton
              label="Yes, delete group"
              buttonType="destructive"
              onClick={handleDelete}
              buttonHeight="sm"
            />
          </CWModalFooter>
        </div>
      }
      onClose={onClose}
      open={isOpen}
    />
  );
};
