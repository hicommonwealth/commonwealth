import useBrowserWindow from 'hooks/useBrowserWindow';
import { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import {
  ReactQuillEditor,
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { TopicForm } from 'views/pages/CommunityManagement/Topics/Topics';
import z from 'zod';
import { CreateTopicStep } from '../../utils';
import './CreateTopicSection.scss';
import { topicCreationValidationSchema } from './validation';

interface CreateTopicSectionProps {
  onStepChange: (step: CreateTopicStep) => void;
  onSetTopicFormData: (data: Partial<TopicForm>) => void;
  topicFormData: TopicForm | null;
}

export const CreateTopicSection = ({
  onStepChange,
  onSetTopicFormData,
  topicFormData,
}: CreateTopicSectionProps) => {
  const communityId = app.activeChainId() || '';
  const { data: topics } = useFetchTopicsQuery({
    communityId: communityId,
    includeArchivedTopics: true,
    apiEnabled: !!communityId,
  });

  const [nameErrorMsg, setNameErrorMsg] = useState<string | null>(null);
  const [descErrorMsg, setDescErrorMsg] = useState<string | null>(null);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    topicFormData?.featuredInSidebar || false,
  );
  const [name, setName] = useState<string>(topicFormData?.name || '');
  const [descriptionDelta, setDescriptionDelta] = useState<DeltaStatic>(
    createDeltaFromText(topicFormData?.description || ''),
  );
  const [characterCount, setCharacterCount] = useState(0);

  const { isWindowExtraSmall } = useBrowserWindow({});

  const getCharacterCount = (delta) => {
    if (!delta || !delta.ops) {
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
    if ((descriptionDelta?.ops || [])?.[0]?.insert?.length > 250) {
      setDescErrorMsg('Description must be 250 characters or less');
    } else {
      setDescErrorMsg(null);
    }
  }, [descriptionDelta]);

  const handleSubmit = (
    values: z.infer<typeof topicCreationValidationSchema>,
  ) => {
    onSetTopicFormData({
      name: values.topicName,
      description: getTextFromDelta(descriptionDelta),
      featuredInSidebar,
    });
    onStepChange(CreateTopicStep.WVConsent);
  };

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

          <ReactQuillEditor
            placeholder="Enter a description (Limit of 250 characters)"
            contentDelta={descriptionDelta}
            setContentDelta={setDescriptionDelta}
          />
          <div className="description-char-count">
            <CWText type="caption">
              Character count: {characterCount}/250
            </CWText>
          </div>
          <CWText type="caption">
            Choose whether topic is featured in sidebar.
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
        </div>
        <div className="actions">
          <MessageRow
            statusMessage={descErrorMsg || ''}
            hasFeedback={!!descErrorMsg}
            validationStatus={descErrorMsg ? 'failure' : undefined}
          />
          <CWButton
            label="Next"
            buttonType="primary"
            buttonHeight="med"
            buttonWidth={isWindowExtraSmall ? 'full' : 'wide'}
            disabled={!!nameErrorMsg || !!descErrorMsg}
            type="submit"
          />
        </div>
      </CWForm>
    </div>
  );
};
