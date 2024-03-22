import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import app from 'client/scripts/state';
import {
  useCreateTopicMutation,
  useFetchTopicsQuery,
} from 'client/scripts/state/api/topics';
import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { ValidationStatus } from 'client/scripts/views/components/component_kit/cw_validation_text';
import { CWTextInput } from 'client/scripts/views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'client/scripts/views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/cw_button';
import {
  ReactQuillEditor,
  createDeltaFromText,
  getTextFromDelta,
} from 'client/scripts/views/components/react_quill_editor';
import { DeltaStatic } from 'quill';
import React, { useMemo, useState } from 'react';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import './CreateTopicSection.scss';
import { FormSubmitValues } from './types';
import { topicCreationValidationSchema } from './validation';

export const CreateTopicSection = () => {
  const { mutateAsync: createTopic } = useCreateTopicMutation();
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const [nameErrorMsg, setNameErrorMsg] = useState<string | null>(null);
  const [descErrorMsg, setDescErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [descriptionDelta, setDescriptionDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );

  const { isWindowExtraSmall } = useBrowserWindow({});

  const handleCreateTopic = async (values: FormSubmitValues) => {
    try {
      await createTopic({
        name: values.topicName,
        description: values.topicDescription,
        featuredInSidebar,
        featuredInNewPost: false,
        defaultOffchainTemplate: '',
      });
      navigate(`/discussions/${encodeURI(name.toString().trim())}`);
    } catch (err) {
      setIsSaving(false);
    }
  };

  const handleInputValidation = (text: string): [ValidationStatus, string] => {
    const currentCommunityTopicNames = topics.map((t) => t.name.toLowerCase());

    if (currentCommunityTopicNames.includes(text.toLowerCase())) {
      const err = 'Topic name already used within community.';
      setNameErrorMsg(err);
      return ['failure', err];
    }

    setNameErrorMsg(null);

    return ['success', 'Valid topic name'];
  };

  useMemo(() => {
    if (descriptionDelta?.ops[0]?.insert?.length > 250) {
      setDescErrorMsg('Description must be 250 characters or less');
    } else {
      setDescErrorMsg(null);
    }
  }, [descriptionDelta]);

  return (
    <div className="CreateTopicSection">
      <CWForm
        validationSchema={topicCreationValidationSchema}
        onSubmit={handleCreateTopic}
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
              {descriptionDelta.ops[0].insert.length} / 250
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
            statusMessage={descErrorMsg}
            hasFeedback={!!descErrorMsg}
            validationStatus={descErrorMsg ? 'failure' : undefined}
          />
          <CWButton
            label="Create topic"
            buttonType="primary"
            buttonHeight="med"
            buttonWidth={isWindowExtraSmall ? 'full' : 'wide'}
            disabled={isSaving || !!nameErrorMsg || !!descErrorMsg}
            type="submit"
            onClick={() =>
              handleCreateTopic({
                topicName: name,
                topicDescription: getTextFromDelta(descriptionDelta),
              })
            }
          />
        </div>
      </CWForm>
    </div>
  );
};
