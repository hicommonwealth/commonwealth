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
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/cw_button';
import React, { useState } from 'react';
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(false);
  const [name, setName] = useState<string>('');

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
          <CWTextInput
            hookToForm
            label="Description"
            placeholder="Enter a description"
            name="topicDescription"
            tabIndex={2}
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
        </div>
        <div className="actions">
          <CWButton
            label="Create topic"
            buttonType="primary"
            buttonHeight="med"
            buttonWidth={isWindowExtraSmall ? 'full' : 'wide'}
            disabled={isSaving || !!nameErrorMsg}
            type="submit"
          />
        </div>
      </CWForm>
    </div>
  );
};
