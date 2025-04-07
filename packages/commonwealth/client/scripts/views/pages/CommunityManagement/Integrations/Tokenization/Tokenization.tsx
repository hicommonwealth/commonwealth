import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWModal } from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import React, { useState } from 'react';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './Tokenization.scss';
import TokenizationModal from './TokenizationModal';

const Tokenization = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const communityId = app.activeChainId() || '';

  const { data: topics = [] } = useFetchTopicsQuery({
    communityId,
    includeArchivedTopics: false,
    apiEnabled: !!communityId,
  });

  const tokenizedTopicsCount = topics.filter(
    (topic) => topic.allow_tokenized_threads,
  ).length;

  const handleUnderstand = () => {};

  const handleDismiss = () => {};

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleSaveChanges = () => {
    setIsModalOpen(false);
  };

  return (
    <section className="Tokenization">
      <div className="header">
        <div className="flex-row">
          <CWText type="h4">Tokenization</CWText>
        </div>
        <CWText type="b1">
          Tokenize threads in specific topics or your entire community.
        </CWText>
        <CWText type="b1">
          <CWIcon iconName="checkCircleFilled" /> Active with{' '}
          {tokenizedTopicsCount} topics are connected.
        </CWText>
      </div>

      <CWButton
        buttonType="secondary"
        label="Tokenization Settings"
        onClick={() => setIsModalOpen(true)}
      />

      <CWModal
        size="small"
        content={
          <TokenizationModal
            onUnderstand={handleUnderstand}
            onDismiss={handleDismiss}
            onCancel={handleCancel}
            onSaveChanges={handleSaveChanges}
          />
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default Tokenization;
