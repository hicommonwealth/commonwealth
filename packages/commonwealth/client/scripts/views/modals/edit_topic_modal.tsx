import { pluralizeWithoutNumberPrefix } from 'helpers';
import React, { useState } from 'react';
import Topic from '../../models/Topic';
import { useCommonNavigate } from '../../navigation/helpers';
import app from '../../state';
import {
  useDeleteTopicMutation,
  useEditTopicMutation,
} from '../../state/api/topics';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { openConfirmation } from './confirmation_modal';

import { notifySuccess } from 'controllers/app/notifications';
import { DeltaStatic } from 'quill';
import '../../../styles/modals/edit_topic_modal.scss';
import { ReactQuillEditor } from '../components/react_quill_editor';
import { createDeltaFromText } from '../components/react_quill_editor/utils';

type EditTopicModalProps = {
  onModalClose: () => void;
  topic: Topic;
  noRedirect?: boolean;
};

export const EditTopicModal = ({
  topic,
  onModalClose,
  noRedirect,
}: EditTopicModalProps) => {
  const {
    description: descriptionProp,
    featured_in_sidebar: featuredInSidebarProp,
    id,
    name: nameProp,
  } = topic;

  const navigate = useCommonNavigate();
  const { mutateAsync: editTopic } = useEditTopicMutation();
  const { mutateAsync: deleteTopic } = useDeleteTopicMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [description, setDescription] = useState<DeltaStatic>(
    createDeltaFromText(descriptionProp),
  );
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    featuredInSidebarProp,
  );
  const [name, setName] = useState<string>(nameProp);

  const handleSaveChanges = async () => {
    setIsSaving(true);

    try {
      await editTopic({
        topic_id: id!,
        description: JSON.stringify(description),
        name: name,
        community_id: app.activeChainId()!,
        telegram: null,
        featured_in_sidebar: featuredInSidebar,
        featured_in_new_post: false,
        default_offchain_template: '',
      });
      if (noRedirect) {
        onModalClose();
        notifySuccess('Topic updated!');
      } else {
        navigate(`/discussions/${encodeURI(name.toString().trim())}`);
      }
    } catch (err) {
      setErrorMsg(err.message || err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTopic = async () => {
    openConfirmation({
      title: 'Warning',
      description: <>Delete this topic?</>,
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            await deleteTopic({
              community_id: app.activeChainId() || '',
              topic_id: id!,
            });
            if (noRedirect) {
              onModalClose();
            } else {
              navigate('/');
            }
          },
        },
      ],
    });
  };

  return (
    <div className="EditTopicModal">
      <CWModalHeader label="Edit topic" onModalClose={onModalClose} />
      <CWModalBody>
        <CWTextInput
          label="Name"
          value={name}
          onInput={(e) => {
            setName(e.target.value);
          }}
          inputValidationFn={(text: string) => {
            let newErrorMsg;

            const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);
            if (disallowedCharMatches) {
              newErrorMsg = `The ${pluralizeWithoutNumberPrefix(
                disallowedCharMatches.length,
                'char',
              )}
                ${disallowedCharMatches.join(', ')} are not permitted`;
              setErrorMsg(newErrorMsg);
              return ['failure', newErrorMsg];
            }

            if (errorMsg) {
              setErrorMsg(null);
            }

            return ['success', 'Valid topic name'];
          }}
        />
        <ReactQuillEditor
          className="editor"
          placeholder="Enter a description (Limit of 250 characters)"
          contentDelta={description}
          setContentDelta={setDescription}
          fromManageTopic
        />
        <CWCheckbox
          label="Featured in Sidebar"
          checked={featuredInSidebar}
          onChange={() => {
            setFeaturedInSidebar(!featuredInSidebar);
          }}
          value=""
        />
      </CWModalBody>
      <CWModalFooter className="EditTopicModalFooter">
        <div className="action-buttons">
          <div className="delete-topic">
            <CWButton
              buttonType="destructive"
              buttonHeight="sm"
              disabled={isSaving}
              onClick={handleDeleteTopic}
              label="Delete topic"
            />
          </div>
          <CWButton
            label="Cancel"
            buttonType="secondary"
            buttonHeight="sm"
            onClick={onModalClose}
          />
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            onClick={handleSaveChanges}
            label="Save changes"
          />
        </div>
        {errorMsg && (
          <CWValidationText
            className="error-message"
            message={errorMsg}
            status="failure"
          />
        )}
      </CWModalFooter>
    </div>
  );
};
