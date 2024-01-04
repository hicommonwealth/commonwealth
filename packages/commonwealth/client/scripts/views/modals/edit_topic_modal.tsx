import type { DeltaStatic } from 'quill';
import React, { useState } from 'react';

import { pluralizeWithoutNumberPrefix } from 'helpers';
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
import {
  ReactQuillEditor,
  getTextFromDelta,
} from '../components/react_quill_editor';
import {
  deserializeDelta,
  serializeDelta,
} from '../components/react_quill_editor/utils';
import { openConfirmation } from './confirmation_modal';

import '../../../styles/modals/edit_topic_modal.scss';

type EditTopicModalProps = {
  onModalClose: () => void;
  topic: Topic;
};

export const EditTopicModal = ({
  topic,
  onModalClose,
}: EditTopicModalProps) => {
  const {
    defaultOffchainTemplate,
    description: descriptionProp,
    featuredInNewPost: featuredInNewPostProp,
    featuredInSidebar: featuredInSidebarProp,
    id,
    name: nameProp,
  } = topic;

  const navigate = useCommonNavigate();
  const { mutateAsync: editTopic } = useEditTopicMutation();
  const { mutateAsync: deleteTopic } = useDeleteTopicMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(
    deserializeDelta(defaultOffchainTemplate),
  );

  const [description, setDescription] = useState<string>(descriptionProp);
  const [featuredInNewPost, setFeaturedInNewPost] = useState<boolean>(
    featuredInNewPostProp,
  );
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    featuredInSidebarProp,
  );
  const [name, setName] = useState<string>(nameProp);

  const editorText = getTextFromDelta(contentDelta);

  const handleSaveChanges = async () => {
    setIsSaving(true);

    if (featuredInNewPost && editorText.length === 0) {
      setErrorMsg('Must provide template.');
      return;
    }

    const topicInfo: TopicAttributes = {
      id,
      description: description,
      name: name,
      community_id: app.activeChainId(),
      telegram: null,
      featured_in_sidebar: featuredInSidebar,
      featured_in_new_post: featuredInNewPost,
      default_offchain_template: featuredInNewPost
        ? serializeDelta(contentDelta)
        : null,
      total_threads: topic.totalThreads || 0,
    };

    try {
      await editTopic({ topic: new Topic(topicInfo) });
      navigate(`/discussions/${encodeURI(name.toString().trim())}`);
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
            navigate('/');
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
        <CWCheckbox
          label="Featured in New Post"
          checked={featuredInNewPost}
          onChange={() => {
            setFeaturedInNewPost(!featuredInNewPost);
          }}
          value=""
        />
        {featuredInNewPost && (
          <ReactQuillEditor
            contentDelta={contentDelta}
            setContentDelta={setContentDelta}
            tabIndex={3}
          />
        )}
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
