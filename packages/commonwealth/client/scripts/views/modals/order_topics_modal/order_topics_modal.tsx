import React, { useState } from 'react';

import { notifyError } from '../../../controllers/app/notifications';
import type Topic from '../../../models/Topic';
import app from '../../../state';
import {
  useFetchTopicsQuery,
  useUpdateFeaturedTopicsOrderMutation,
} from '../../../state/api/topics';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import DraggableTopicsList from './draggable_topics_list';

import '../../../../styles/modals/order_topics_modal.scss';

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
    communityId: app.activeChainId(),
  });

  const { mutateAsync: updateFeaturedTopicsOrder } =
    useUpdateFeaturedTopicsOrderMutation();

  const [topics, setTopics] = useState<Topic[]>(() =>
    getFilteredTopics(rawTopics),
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
      <CWModalHeader label="Reorder Topics" onModalClose={onModalClose} />
      <CWModalBody>
        <div className="featured-topic-list">
          {topics.length ? (
            <DraggableTopicsList topics={topics} setTopics={setTopics} />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onModalClose}
        />
        <CWButton
          buttonType="primary"
          buttonHeight="sm"
          onClick={handleSave}
          label="Save"
        />
      </CWModalFooter>
    </div>
  );
};
