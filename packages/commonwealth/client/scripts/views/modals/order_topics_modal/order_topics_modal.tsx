import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';

import { notifyError } from 'controllers/app/notifications';
import type Topic from '../../../models/Topic';
import app from 'state';
import DraggableTopicsList from './draggable_topics_list';
import {
  useFetchTopicsQuery,
  useUpdateFeaturedTopicsOrderMutation,
} from 'state/api/topics';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWText } from '../../components/component_kit/cw_text';

import 'modals/order_topics_modal.scss';

type OrderTopicsModalProps = {
  onModalClose: () => void;
};

const getFilteredTopics = (rawTopics: Topic[]): Topic[] => {
  const topics = rawTopics
    .filter((topic) => topic.featuredInSidebar)
    .map((topic) => ({ ...topic } as Topic));

  if (!topics.length) return [];

  if (!topics[0].order) {
    return topics
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce((acc, curr, index) => {
        return [...acc, { ...curr, order: index + 1 }];
      }, []);
  } else {
    return topics.sort((a, b) => a.order - b.order);
  }
};

export const OrderTopicsModal = ({ onModalClose }: OrderTopicsModalProps) => {
  const { data: rawTopics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const { mutateAsync: updateFeaturedTopicsOrder } =
    useUpdateFeaturedTopicsOrderMutation();

  const [topics, setTopics] = useState<Topic[]>(() =>
    getFilteredTopics(rawTopics)
  );

  const handleSave = async () => {
    try {
      await updateFeaturedTopicsOrder({ featuredTopics: topics });
      onModalClose();
    } catch (err) {
      notifyError('Failed to update order');
    }
  };

  return (
    <div className="OrderTopicsModal">
      <div className="compact-modal-title">
        <CWText className="title-text" type="h4">
          Reorder Topics
        </CWText>
        <X className="close-icon" onClick={() => onModalClose()} size={24} />
      </div>
      <div className="compact-modal-body">
        <div className="featured-topic-list">
          {topics.length ? (
            <DraggableTopicsList topics={topics} setTopics={setTopics} />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>
        <div className="button">
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            onClick={handleSave}
            label="Save"
          />
        </div>
      </div>
    </div>
  );
};
