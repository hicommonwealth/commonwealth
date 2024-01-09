import type { DeltaStatic } from 'quill';
import React, { useEffect } from 'react';
import { pluralizeWithoutNumberPrefix } from '../../helpers';
import { useCommonNavigate } from '../../navigation/helpers';
import app from '../../state';
import {
  useCreateTopicMutation,
  useFetchTopicsQuery,
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
  createDeltaFromText,
  getTextFromDelta,
} from '../components/react_quill_editor';
import { serializeDelta } from '../components/react_quill_editor/utils';

import '../../../styles/modals/new_topic_modal.scss';

type NewTopicModalProps = {
  onModalClose: () => void;
};

export const NewTopicModal = (props: NewTopicModalProps) => {
  const { onModalClose } = props;
  const { mutateAsync: createTopic } = useCreateTopicMutation();
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(
    createDeltaFromText(''),
  );
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [description, setDescription] = React.useState<string>('');
  const [featuredInNewPost, setFeaturedInNewPost] =
    React.useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] =
    React.useState<boolean>(false);
  const [name, setName] = React.useState<string>('');

  const editorText = getTextFromDelta(contentDelta);

  useEffect(() => {
    if (!name || !name.trim()) {
      setErrorMsg('Name must be specified.');
      return;
    }
    if (featuredInNewPost && editorText.length === 0) {
      setErrorMsg('Must add template.');
      return;
    }
    setErrorMsg(null);
  }, [name, featuredInNewPost, editorText]);

  return (
    <div className="NewTopicModal">
      <CWModalHeader label="New topic" onModalClose={onModalClose} />
      <CWModalBody>
        <CWTextInput
          label="Name"
          value={name}
          onInput={(e) => {
            setName(e.target.value);
          }}
          inputValidationFn={(text: string) => {
            const currentCommunityTopicNames = topics.map((t) =>
              t.name.toLowerCase(),
            );

            if (currentCommunityTopicNames.includes(text.toLowerCase())) {
              const err = 'Topic name already used within community.';
              setErrorMsg(err);
              return ['failure', err];
            }

            const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);

            if (disallowedCharMatches) {
              const err = `The ${pluralizeWithoutNumberPrefix(
                disallowedCharMatches.length,
                'char',
              )}
                ${disallowedCharMatches.join(', ')} are not permitted`;
              setErrorMsg(err);
              return ['failure', err];
            }

            if (errorMsg) {
              setErrorMsg(null);
            }

            return ['success', 'Valid topic name'];
          }}
          autoFocus
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
        <div className="checkboxes">
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
        </div>
        {featuredInNewPost && (
          <ReactQuillEditor
            contentDelta={contentDelta}
            setContentDelta={setContentDelta}
          />
        )}
      </CWModalBody>
      <CWModalFooter className="NewTopicModalFooter">
        <div className="action-buttons">
          <CWButton
            label="Cancel"
            buttonType="secondary"
            buttonHeight="sm"
            onClick={onModalClose}
          />
          <CWButton
            label="Create topic"
            buttonType="primary"
            buttonHeight="sm"
            disabled={isSaving || !!errorMsg}
            onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              try {
                await createTopic({
                  name,
                  description,
                  featuredInSidebar,
                  featuredInNewPost,
                  defaultOffchainTemplate: serializeDelta(contentDelta),
                });
                navigate(`/discussions/${encodeURI(name.toString().trim())}`);
                onModalClose();
              } catch (err) {
                setErrorMsg('Error creating topic');
                setIsSaving(false);
              }
            }}
          />
        </div>
        {errorMsg && (
          <CWValidationText
            className="validation-text"
            message={errorMsg}
            status="failure"
          />
        )}
      </CWModalFooter>
    </div>
  );
};
