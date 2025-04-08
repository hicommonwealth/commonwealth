import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from 'client/scripts/views/components/component_kit/cw_text_input';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import app from 'state';
import useEditCommunityTokenMutation from 'state/api/communities/editCommunityToken';
import { useEditTopicMutation, useFetchTopicsQuery } from 'state/api/topics';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './TokenizationModal.scss';

interface TokenizationModalProps {
  onUnderstand: () => void;
  onDismiss: () => void;
  onCancel: () => void;
  onSaveChanges: () => void;
}

type TopicOption = {
  label: string;
  value: string;
};

const TokenizationModal = ({
  onUnderstand,
  onDismiss,
  onCancel,
  onSaveChanges,
}: TokenizationModalProps) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tokenizeAllTopics, setTokenizeAllTopics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deselectedTopics, setDeselectedTopics] = useState<string[]>([]);
  const [threadPurchaseToken, setThreadPurchaseToken] = useState('');

  const communityId = app.activeChainId() || '';
  const { data: topics = [] } = useFetchTopicsQuery({
    communityId,
    includeArchivedTopics: false,
    apiEnabled: !!communityId,
  });

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const { mutateAsync: editTopic } = useEditTopicMutation();
  const { mutateAsync: editCommunityToken } = useEditCommunityTokenMutation();

  useEffect(() => {
    const tokenizedTopicIds = topics
      .filter((topic) => topic.allow_tokenized_threads)
      .map((topic) => topic.id?.toString() || '')
      .filter(Boolean);
    setSelectedTopics(tokenizedTopicIds);
  }, [topics]);

  useEffect(() => {
    if (community?.thread_purchase_token) {
      setThreadPurchaseToken(community.thread_purchase_token);
    }
  }, [community]);

  const topicOptions = topics.map((topic) => ({
    label: topic.name,
    value: topic.id?.toString() || '',
  }));

  const handleTopicSelection = (selectedOptions: TopicOption[]) => {
    const selectedIds = selectedOptions.map((option) => option.value);

    const newlyDeselectedTopics = selectedTopics.filter(
      (id) => !selectedIds.includes(id),
    );

    setDeselectedTopics([...deselectedTopics, ...newlyDeselectedTopics]);

    setSelectedTopics(selectedIds);
    setTokenizeAllTopics(selectedIds.length === topicOptions.length);
  };

  const handleTokenizeAllTopicsChange = (checked: boolean) => {
    setTokenizeAllTopics(checked);
    if (checked) {
      setSelectedTopics(topicOptions.map((option) => option.value));
      setDeselectedTopics([]);
    } else {
      setSelectedTopics([]);
      const previouslyTokenizedTopics = topics
        .filter((topic) => topic.allow_tokenized_threads)
        .map((topic) => topic.id?.toString() || '')
        .filter(Boolean);
      setDeselectedTopics(previouslyTokenizedTopics);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatePromises = selectedTopics.map((topicId) =>
        editTopic({
          topic_id: parseInt(topicId, 10),
          community_id: communityId,
          allow_tokenized_threads: true,
        }),
      );

      const deselectPromises = deselectedTopics.map((topicId) =>
        editTopic({
          topic_id: parseInt(topicId, 10),
          community_id: communityId,
          allow_tokenized_threads: false,
        }),
      );

      await Promise.all([...updatePromises, ...deselectPromises]);

      if (threadPurchaseToken.trim()) {
        await editCommunityToken({
          community_id: communityId,
          thread_purchase_token: threadPurchaseToken.trim(),
        });
      }

      notifySuccess('Topics updated successfully');
      onSaveChanges();
    } catch (error) {
      console.error('Error updating topics:', error);
      notifyError('Failed to update topics');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="TokenizationModal">
      <CWModalHeader label="Tokenization Settings" onModalClose={onCancel} />

      <CWModalBody>
        <div className="info-box">
          <div className="header">
            <CWIcon iconName="infoEmpty" className="blue-icon" />
            <CWText type="b2" fontWeight="semiBold" className="blue">
              How it works
            </CWText>
          </div>

          <CWText className="blue">
            By default, all topics created in this community allow tokenized
            threads. Threads created in these topics will count as entries
            during community-wide contests. Read more about tokenized threads
            here.
          </CWText>
          <div className="info-actions">
            <CWButton
              buttonType="secondary"
              label="I understand"
              onClick={onUnderstand}
            />
            <CWButton
              buttonType="tertiary"
              label="Dismiss"
              onClick={onDismiss}
            />
          </div>
        </div>

        <div className="topics-row">
          <div className="header">
            <CWText type="b2" fontWeight="semiBold">
              Tokenized Topics
            </CWText>
            <CWCheckbox
              label="Tokenize all topics"
              name="tokenizeAllTopics"
              checked={tokenizeAllTopics}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTokenizeAllTopicsChange(e.target.checked)
              }
            />
          </div>

          <CWSelectList
            name="searchTopics"
            placeholder="Search Topics"
            isSearchable={true}
            options={topicOptions}
            isMulti={true}
            value={topicOptions.filter((option) =>
              selectedTopics.includes(option.value),
            )}
            onChange={handleTopicSelection}
          />
        </div>

        <div className="token-section">
          <CWText type="b2" fontWeight="semiBold">
            Primary token
          </CWText>
          <CWText type="caption" className="caption">
            Enter a token to purchase and sell threads in this community.
          </CWText>

          <CWTextInput
            value={threadPurchaseToken}
            onInput={(e: React.FormEvent<HTMLInputElement>) =>
              setThreadPurchaseToken(e.currentTarget.value)
            }
            placeholder="Enter token address"
          />
        </div>
      </CWModalBody>

      <CWModalFooter>
        <CWButton buttonType="secondary" label="Cancel" onClick={onCancel} />
        <CWButton
          buttonType="primary"
          label="Save Changes"
          onClick={() => {
            void handleSaveChanges();
          }}
          disabled={isSaving}
        />
      </CWModalFooter>
    </div>
  );
};

export default TokenizationModal;
