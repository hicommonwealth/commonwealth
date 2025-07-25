import { useFlag } from 'client/scripts/hooks/useFlag';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import {
  ReactQuillEditor,
  createDeltaFromText,
} from 'views/components/react_quill_editor';
import { TopicForm } from 'views/pages/CommunityManagement/Topics/Topics';
import z from 'zod';
import { CreateTopicStep } from '../../utils';
import './CreateTopicSection.scss';
import { topicCreationValidationSchema } from './validation';

interface CreateTopicSectionProps {
  onStepChange: (step: CreateTopicStep) => void;
  onSetTopicFormData: (data: Partial<TopicForm>) => void;
  onGroupsSelected?: (groups: number[]) => void;
  topicFormData: TopicForm | null;
}

export const CreateTopicSection = ({
  onStepChange,
  onSetTopicFormData,
  onGroupsSelected,
  topicFormData,
}: CreateTopicSectionProps) => {
  const privateTopicsEnabled = useFlag('privateTopics');

  const communityId = app.activeChainId() || '';
  const { data: topics } = useFetchTopicsQuery({
    communityId: communityId,
    includeArchivedTopics: true,
    apiEnabled: !!communityId,
  });

  const [nameErrorMsg, setNameErrorMsg] = useState<string | null>(null);
  const [descErrorMsg, setDescErrorMsg] = useState<string | null>(null);
  const [newPostTemplateError, setNewPostTemplateError] = useState<
    string | null
  >(null);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    topicFormData?.featuredInSidebar || false,
  );
  const [featuredInNewPost, setFeaturedInNewPost] = useState<boolean>(
    topicFormData?.featuredInNewPost || false,
  );
  const [name, setName] = useState<string>(topicFormData?.name || '');
  const [descriptionDelta, setDescriptionDelta] = useState<string>(
    topicFormData?.description || '',
  );
  const [newPostTemplate, setNewPostTemplate] = useState<DeltaStatic>(
    createDeltaFromText(topicFormData?.newPostTemplate || ''),
  );
  const [characterCount, setCharacterCount] = useState(0);

  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const { data: groups } = useFetchGroupsQuery({
    communityId: communityId,
    enabled: !!communityId,
  });

  const { isWindowExtraSmall } = useBrowserWindow({});

  const getCharacterCount = (delta) => {
    if (!delta || !delta.ops) {
      if (typeof delta === 'string' && delta.length) return delta.length;
      return 0;
    }
    return delta.ops.reduce((count, op) => {
      if (typeof op.insert === 'string') {
        const cleanedText = op.insert.replace(/\n$/, '');
        return count + cleanedText.length;
      }
      return count;
    }, 0);
  };

  useEffect(() => {
    const count = getCharacterCount(descriptionDelta);
    setCharacterCount(count);
  }, [descriptionDelta]);

  const handleInputValidation = (text: string): [ValidationStatus, string] => {
    // @ts-expect-error <StrictNullChecks/>
    const currentCommunityTopicNames = topics.map((t) => t.name.toLowerCase());

    if (currentCommunityTopicNames.includes(text.toLowerCase())) {
      const err = 'Topic name already used within community.';
      setNameErrorMsg(err);
      return ['failure', err];
    }

    setNameErrorMsg(null);

    return ['success', 'Valid topic name'];
  };

  useEffect(() => {
    if (descriptionDelta?.length > 250) {
      setDescErrorMsg('Description must be 250 characters or less');
    } else {
      setDescErrorMsg(null);
    }
  }, [descriptionDelta]);

  useEffect(() => {
    if (
      featuredInNewPost &&
      (newPostTemplate?.ops || [])?.[0]?.insert?.trim?.()?.length === 0
    ) {
      setNewPostTemplateError('Topic template is required');
    } else {
      setNewPostTemplateError(null);
    }
  }, [featuredInNewPost, newPostTemplate]);

  const handleSubmit = (
    values: z.infer<typeof topicCreationValidationSchema>,
  ) => {
    onSetTopicFormData({
      name: values.topicName,
      description: descriptionDelta,
      featuredInSidebar,
      featuredInNewPost,
      newPostTemplate:
        featuredInNewPost && newPostTemplate
          ? JSON.stringify(newPostTemplate)
          : '',
    });
    if (onGroupsSelected) onGroupsSelected(selectedGroups);
    onStepChange(CreateTopicStep.WVConsent);
  };

  useEffect(() => {
    if (onGroupsSelected) onGroupsSelected(selectedGroups);
  }, [selectedGroups, onGroupsSelected]);

  return (
    <div className="CreateTopicSection">
      <CWForm
        validationSchema={topicCreationValidationSchema}
        onSubmit={handleSubmit}
      >
        <div className="form-inputs">
          <CWTextInput
            hookToForm
            label="Name (required)"
            placeholder="Enter a topic name"
            name="topicName"
            value={name}
            onInput={(e) => {
              setName(e.target.value);
              handleInputValidation(e.target.value.trim());
            }}
            // @ts-expect-error <StrictNullChecks/>
            customError={nameErrorMsg}
            autoFocus
          />

          <CWTextInput
            hookToForm
            label="Description"
            placeholder="description"
            name="description"
            value={descriptionDelta}
            onInput={(e) => {
              setDescriptionDelta(e.target.value);
            }}
            // @ts-expect-error <StrictNullChecks/>
            customError={descErrorMsg}
          />
          <div className="description-char-count">
            <CWText type="caption">
              Character count: {characterCount}/250
            </CWText>
          </div>
          <CWText type="caption">Choose whether topic is featured</CWText>
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
          <div
            className={clsx(
              'new-topic-template-section',
              featuredInNewPost && 'enabled',
            )}
          >
            <CWCheckbox
              className="sidebar-feature-checkbox"
              label={
                <div>
                  <CWText type="b2">Featured topic in new post</CWText>
                  <CWText type="caption" className="checkbox-label-caption">
                    The topic template you add will be added as base text to
                    every new post within the topic.
                  </CWText>
                </div>
              }
              checked={featuredInNewPost}
              onChange={() => {
                setFeaturedInNewPost(!featuredInNewPost);
              }}
            />
            {featuredInNewPost && (
              <ReactQuillEditor
                placeholder="Add a template for this topic (Limit of 250 characters)"
                contentDelta={newPostTemplate}
                setContentDelta={setNewPostTemplate}
              />
            )}
          </div>
          {privateTopicsEnabled && (
            <CWCheckbox
              label="Private topic"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
            />
          )}
          {privateTopicsEnabled && isPrivate && (
            <CWSelectList
              isMulti
              label="Allowed groups"
              options={groups?.map((g) => ({ label: g.name, value: g.id }))}
              value={groups
                ?.filter((g) => selectedGroups.includes(g.id))
                .map((g) => ({ label: g.name, value: g.id }))}
              onChange={(selected) =>
                setSelectedGroups(selected.map((opt) => opt.value))
              }
            />
          )}
        </div>
        <div className="actions">
          <MessageRow
            statusMessage={descErrorMsg || ''}
            hasFeedback={!!descErrorMsg}
            validationStatus={descErrorMsg ? 'failure' : undefined}
          />
          {featuredInNewPost && (
            <MessageRow
              statusMessage={newPostTemplateError || ''}
              hasFeedback={!!newPostTemplateError}
              validationStatus={newPostTemplateError ? 'failure' : undefined}
            />
          )}
          <CWButton
            label="Next"
            buttonType="primary"
            buttonHeight="med"
            buttonWidth={isWindowExtraSmall ? 'full' : 'wide'}
            disabled={
              !!nameErrorMsg ||
              !!descErrorMsg ||
              (featuredInNewPost && !!newPostTemplateError)
            }
            type="submit"
          />
        </div>
      </CWForm>
    </div>
  );
};
