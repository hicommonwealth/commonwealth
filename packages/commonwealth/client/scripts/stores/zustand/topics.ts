import { StateCreator } from 'zustand';
import { Topic } from '../../models';
import $ from 'jquery';
import app from 'state';

export interface TopicsSlice {
  topics: Topic[];
  initialize: (initialTopics: any) => void;
  getByIdentifier: (identifier: number) => Topic | undefined;
  getByCommunity: (communityId: string) => Topic[];
  getByName: (name: string, communityId: string) => Topic | undefined;
  addTopic: (
    name: string,
    description: string,
    telegram: string,
    featuredInSidebar: boolean,
    featuredInNewPost: boolean,
    tokenThreshold: string,
    defaultOffchainTemplate: string
  ) => void;
  editTopic: (topic: Topic, featuredOrder?: number) => void;
  removeTopic: (topic: Topic) => void;
  updateTopic: (
    threadId: number,
    topicName: string,
    topicId?: number
  ) => Promise<Topic>;
  updateFeaturedOrder: (featuredTopics: Topic[]) => void;
}

const createTopicsSlice: StateCreator<TopicsSlice, [], [], TopicsSlice> = (
  set,
  get
) => ({
  topics: [],
  initialize: (initialTopics) => {
    const initializedTopics = initialTopics.map((t) => new Topic(t));
    set({ topics: initializedTopics });
  },
  getByIdentifier: (identifier: number) =>
    get().topics.find((t) => t.id === identifier),
  getByCommunity: (communityId: string) =>
    get().topics.filter((t) => t.chainId === communityId),
  getByName: (name: string, communityId: string) =>
    get()
      .getByCommunity(communityId)
      .find((t) => t.name === name),
  addTopic: async (
    name: string,
    description: string,
    telegram: string,
    featuredInSidebar: boolean,
    featuredInNewPost: boolean,
    tokenThreshold: string,
    defaultOffchainTemplate: string
  ) => {
    const response = await $.post(`${app.serverUrl()}/createTopic`, {
      chain: app.activeChainId(),
      name,
      description,
      telegram,
      featured_in_sidebar: featuredInSidebar,
      featured_in_new_post: featuredInNewPost,
      default_offchain_template: defaultOffchainTemplate,
      jwt: app.user.jwt,
      token_threshold: tokenThreshold,
    });
    const result = new Topic(response.result);

    set((prev) => ({ topics: [...prev.topics, result] }));
  },
  editTopic: async (topic: Topic, featuredOrder?: number) => {
    const response = await $.post(`${app.serverUrl()}/editTopic`, {
      id: topic.id,
      chain: topic.chainId,
      name: topic.name,
      description: topic.description,
      telegram: topic.telegram,
      featured_in_sidebar: topic.featuredInSidebar,
      featured_in_new_post: topic.featuredInNewPost,
      default_offchain_template: topic.defaultOffchainTemplate,
      featured_order: featuredOrder,
      address: app.user.activeAccount.address,
      jwt: app.user.jwt,
    });
    const result = new Topic(response.result);
    const updatedTopics = get().topics.map((t) => {
      if (t.id === result.id) {
        return result;
      }
      return t;
    });
    set({ topics: updatedTopics });
  },
  removeTopic: async (topic: Partial<Topic>) => {
    await $.post(`${app.serverUrl()}/deleteTopic`, {
      id: topic.id,
      chain: topic.chainId,
      jwt: app.user.jwt,
    });
    const updatedTopics = get().topics.filter((t) => t.id !== topic.id);
    set({ topics: updatedTopics });
  },
  updateTopic: async (
    threadId: number,
    topicName: string,
    topicId?: number
  ) => {
    const response = await $.post(`${app.serverUrl()}/updateTopic`, {
      jwt: app.user.jwt,
      thread_id: threadId,
      topic_id: topicId,
      topic_name: topicName,
      address: app.user.activeAccount.address,
    });
    const result = new Topic(response.result);
    const updatedTopics = get().topics.map((t) => {
      if (t.id === result.id) {
        return result;
      }
      return t;
    });
    set({ topics: updatedTopics });
    return result;
  },
  updateFeaturedOrder: async (featuredTopics: Topic[]) => {
    const orderedIds = featuredTopics
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);

    const response = await $.post(`${app.serverUrl()}/orderTopics`, {
      chain: app.activeChainId(),
      'order[]': orderedIds,
      jwt: app.user.jwt,
    });

    const updatedTopics = get().topics.map((topic) => {
      const found = response.result.find((t) => t.id === topic.id);
      if (found) {
        return new Topic(found);
      }
      return topic;
    });
    set({ topics: updatedTopics });
  },
});

export default createTopicsSlice;
