import { pluralizeWithoutNumberPrefix } from 'client/scripts/helpers';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import app from 'client/scripts/state';
import {
  useCreateTopicMutation,
  useFetchTopicsQuery,
} from 'client/scripts/state/api/topics';
import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import {
  CWValidationText,
  ValidationStatus,
} from 'client/scripts/views/components/component_kit/cw_validation_text';
import { CWTextInput } from 'client/scripts/views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/cw_button';
import {
  ReactQuillEditor,
  createDeltaFromText,
  getTextFromDelta,
} from 'client/scripts/views/components/react_quill_editor';
import { serializeDelta } from 'client/scripts/views/components/react_quill_editor/utils';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import './CreateTopicSection.scss';

export const CreateTopicSection = () => {
  const { mutateAsync: createTopic } = useCreateTopicMutation();
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [contentDelta, setContentDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [featuredInNewPost, setFeaturedInNewPost] = useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(false);
  const [name, setName] = useState<string>('');

  const { isWindowExtraSmall } = useBrowserWindow({});

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

  const handleCreateTopic = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
    } catch (err) {
      setErrorMsg('Error creating topic');
      setIsSaving(false);
    }
  };

  const handleInputValidation = (text: string): [ValidationStatus, string] => {
    const currentCommunityTopicNames = topics.map((t) => t.name.toLowerCase());

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
  };

  return (
    <div className="CreateTopicSection">
      <div className="form">
        <div className="form-inputs">
          <div>
            <CWTextInput
              label="Name (required)"
              placeholder="Enter a topic name"
              value={name}
              onInput={(e) => {
                setName(e.target.value);
              }}
              inputValidationFn={handleInputValidation}
              autoFocus
            />
            {errorMsg && (
              <CWValidationText
                className="validation-text"
                message={errorMsg}
                status="failure"
              />
            )}
          </div>

          <CWTextInput
            label="Description"
            placeholder="Enter a description"
            name="description"
            tabIndex={2}
            value={description}
            onInput={(e) => {
              setDescription(e.target.value);
            }}
          />
          <CWText type="caption">
            Choose where to feature this topic. Select at least one.
          </CWText>
          <CWCheckbox
            className="sidebar-feature-checkbox"
            label={
              <div>
                <CWText type="b2">
                  Featured topic in sidebar (recommended)
                </CWText>
                <CWText type="caption" className="checkbox-label-caption">
                  Please note, only sidebar-featured topics show on the Overview
                  page.
                </CWText>
              </div>
            }
            checked={featuredInSidebar}
            onChange={() => {
              setFeaturedInSidebar(!featuredInSidebar);
            }}
          />
          <CWCheckbox
            label="Featured in new post"
            checked={featuredInNewPost}
            onChange={() => {
              setFeaturedInNewPost(!featuredInNewPost);
            }}
          />
          {featuredInNewPost && (
            <ReactQuillEditor
              contentDelta={contentDelta}
              setContentDelta={setContentDelta}
            />
          )}
        </div>
        <div className="actions">
          <CWButton
            label="Create topic"
            buttonType="primary"
            buttonHeight="med"
            buttonWidth={isWindowExtraSmall ? 'full' : 'wide'}
            disabled={isSaving || !!errorMsg}
            onClick={handleCreateTopic}
          />
        </div>
      </div>
    </div>
  );
};
