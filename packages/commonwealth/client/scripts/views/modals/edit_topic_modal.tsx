import { pluralizeWithoutNumberPrefix } from 'helpers';
import React, { useState } from 'react';
import Topic, { TopicAttributes } from '../../models/Topic';
import { useCommonNavigate } from '../../navigation/helpers';
import app from '../../state';
import {
  useDeleteTopicMutation,
  useEditTopicMutation,
} from '../../state/api/topics';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { openConfirmation } from './confirmation_modal';

import { notifySuccess } from 'client/scripts/controllers/app/notifications';
import '../../../styles/modals/edit_topic_modal.scss';

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
    featuredInSidebar: featuredInSidebarProp,
    id,
    name: nameProp,
  } = topic;

  const navigate = useCommonNavigate();
  const { mutateAsync: editTopic } = useEditTopicMutation();
  const { mutateAsync: deleteTopic } = useDeleteTopicMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [description, setDescription] = useState<string>(descriptionProp);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    featuredInSidebarProp,
  );
  const [name, setName] = useState<string>(nameProp);

  const handleSaveChanges = async () => {
    setIsSaving(true);

    const topicInfo: TopicAttributes = {
      id,
      description: description,
      name: name,
      community_id: app.activeChainId(),
      telegram: null,
      featured_in_sidebar: featuredInSidebar,
      featured_in_new_post: false,
      default_offchain_template: '',
      total_threads: topic.totalThreads || 0,
    };

    try {
      await editTopic({ topic: new Topic(topicInfo) });
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
              topicId: id,
              topicName: name,
              communityId: app.activeChainId(),
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
        <CWTextInput
          label="Description"
          name="description"
          tabIndex={2}
          value={description}
          onInput={(e) => {
            setDescription(e.target.value);
          }}
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
