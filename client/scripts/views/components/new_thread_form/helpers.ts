import topics from 'client/scripts/controllers/server/topics';
import { IChainAdapter, OffchainTopic } from 'client/scripts/models';
import { INewThreadForm, NewThreadErrors, ThreadKind } from './types';

export const checkNewThreadErrors = (
  form: INewThreadForm,
  bodyText?: string
) => {
  if (!form.title) {
    throw new Error(NewThreadErrors.NoTitle);
  }
  if (!form.topicName && topics.length > 0) {
    throw new Error(NewThreadErrors.NoTopic);
  }
  if (form.kind === ThreadKind.Discussion && !bodyText.length) {
    throw new Error(NewThreadErrors.NoBody);
  } else if (form.kind === ThreadKind.Link && !form.url) {
    throw new Error(NewThreadErrors.NoUrl);
  }
};

export const updateTopicList = (
  topic: OffchainTopic,
  activeEntity: IChainAdapter<any, any>
) => {
  try {
    const topicNames = Array.isArray(activeEntity?.meta?.topics)
      ? activeEntity.meta.topics.map((t) => t.name)
      : [];
    if (!topicNames.includes(topic.name)) {
      activeEntity.meta.topics.push(topic);
    }
  } catch (e) {
    console.log(`Error adding new topic to ${activeEntity.name}.`);
  }
};
