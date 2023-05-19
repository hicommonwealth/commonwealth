import React, { useState } from 'react';

import 'modals/order_topics_modal.scss';

import { notifyError } from 'controllers/app/notifications';
import type Topic from '../../../models/Topic';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

import DraggableTopicsList from './draggable_topics_list';
import { CWText } from '../../components/component_kit/cw_text';
import {
  useFetchTopicsQuery,
  useUpdateFeaturedTopicsOrderMutation,
} from 'state/api/topics';

type OrderTopicsModalProps = {
  onModalClose: () => void;
};

const getSortedTopics = (rawTopics: Topic[]): Topic[] => {
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
    getSortedTopics(rawTopics)
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
        <h3>Reorder Topics</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <div className="featured-topic-list">
          {topics.length ? (
            <DraggableTopicsList topics={topics} setTopics={setTopics} />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>
        <CWButton onClick={handleSave} label="Save" />
      </div>
    </div>
  );
};
