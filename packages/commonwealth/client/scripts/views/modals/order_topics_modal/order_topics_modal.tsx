import React, { useState } from 'react';

import 'modals/order_topics_modal.scss';

import { notifyError } from 'controllers/app/notifications';
import type { Topic } from 'models';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

import DraggableTopicsList from './draggable_topics_list';
import { CWText } from '../../components/component_kit/cw_text';
import useAppStore from 'stores/zustand';

type OrderTopicsModalProps = {
  onModalClose: () => void;
};

const getSortedTopics = (topics: Topic[]): Topic[] => {
  topics
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
  const [getByCommunity, updateFeaturedOrder] = useAppStore((s) => [
    s.getByCommunity,
    s.updateFeaturedOrder,
  ]);

  const [topics, setTopics] = useState<Topic[]>(() =>
    getSortedTopics(getByCommunity(app.activeChainId()))
  );

  const handleSave = async () => {
    try {
      await updateFeaturedOrder(topics);
      onModalClose();
      app.threads.isFetched.emit('redraw');
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
