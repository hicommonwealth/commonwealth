import type { DeltaStatic } from 'quill';
import { useEffect, useMemo, useState } from 'react';

import { useDraft } from 'hooks/useDraft';
import { useSearchParams } from 'react-router-dom';
import type { Topic } from '../../../../models/Topic';
import { ThreadKind } from '../../../../models/types';
import { getTextFromDelta } from '../../react_quill_editor';

type NewThreadDraft = {
  topicId: number;
  title: string;
  body: DeltaStatic;
};

interface UseNewThreadFormOptions {
  contentDelta?: DeltaStatic;
  setContentDelta?: (delta: DeltaStatic) => void;
}

const useNewThreadForm = (
  communityId: string,
  topicsForSelector: Topic[],
  options: UseNewThreadFormOptions = {},
) => {
  const [searchParams] = useSearchParams();
  const topicIdFromUrl: number = parseInt(searchParams.get('topic') || '0');

  const { saveDraft, restoreDraft, clearDraft } = useDraft<NewThreadDraft>(
    `new-thread-${communityId}-info`,
  );
  const [canShowGatingBanner, setCanShowGatingBanner] = useState(true);
  const [canShowTopicPermissionBanner, setCanShowTopicPermissionBanner] =
    useState(true);

  // get restored draft on init
  const restoredDraft: NewThreadDraft | null = useMemo(() => {
    if (!topicsForSelector.length || topicIdFromUrl === 0) {
      return null;
    }
    return restoreDraft();
  }, [restoreDraft, topicsForSelector, topicIdFromUrl]);

  const defaultTopic = useMemo(() => {
    if (topicIdFromUrl) {
      return topicsForSelector.find((t) => t.id === topicIdFromUrl);
    }
    if (restoredDraft?.topicId) {
      return topicsForSelector.find((t) => t.id === restoredDraft.topicId);
    }
    return (
      topicsForSelector.find(
        (t) => t.name.includes('General') || t.order === 1,
      ) || null
    );
  }, [topicIdFromUrl, restoredDraft, topicsForSelector]);

  const [threadKind, setThreadKind] = useState<ThreadKind>(
    ThreadKind.Discussion,
  );
  const [threadUrl, setThreadUrl] = useState('');
  // @ts-expect-error StrictNullChecks
  const [threadTopic, setThreadTopic] = useState<Topic>(defaultTopic);
  const [threadTitle, setThreadTitle] = useState(restoredDraft?.title || '');

  // Use internal state if external state is not provided
  const [internalThreadContentDelta, setInternalThreadContentDelta] =
    useState<DeltaStatic>(restoredDraft?.body);

  // Use external contentDelta and setContentDelta if provided
  const threadContentDelta =
    options.contentDelta !== undefined
      ? options.contentDelta
      : internalThreadContentDelta;
  const setThreadContentDelta =
    options.setContentDelta || setInternalThreadContentDelta;

  const [isSaving, setIsSaving] = useState(false);

  const editorText = getTextFromDelta(threadContentDelta);

  const isDiscussion = threadKind === ThreadKind.Discussion;
  const disableSave = isSaving;
  const hasTopics = !!topicsForSelector?.length;
  const topicMissing = hasTopics && !threadTopic;
  const titleMissing = !threadTitle;
  const linkContentMissing = !isDiscussion && !threadUrl;
  const contentMissing = editorText.length === 0;

  const isDisabled =
    disableSave ||
    titleMissing ||
    topicMissing ||
    linkContentMissing ||
    contentMissing;

  useEffect(() => {
    if (defaultTopic) {
      setThreadTopic(defaultTopic);
    }
  }, [defaultTopic]);

  // on content updated, save draft
  useEffect(() => {
    const draft = {
      topicId: threadTopic?.id || 0,
      title: threadTitle,
      body: threadContentDelta,
    };
    if (!draft.topicId && !draft.title && !draft.body) {
      return;
    }
    saveDraft(draft);

    if (!threadContentDelta && threadTopic?.default_offchain_template) {
      try {
        const template = JSON.parse(
          decodeURIComponent(threadTopic.default_offchain_template),
        ) as DeltaStatic;
        setThreadContentDelta(template);
      } catch (e) {
        console.log(e);
      }
    }

    if (!threadTopic && defaultTopic) {
      setThreadTopic(defaultTopic);
    }
  }, [
    saveDraft,
    threadTopic,
    threadTitle,
    threadContentDelta,
    defaultTopic,
    setThreadContentDelta,
  ]);

  return {
    threadKind,
    setThreadKind,
    threadTitle,
    setThreadTitle,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    isSaving,
    setIsSaving,
    isDisabled,
    clearDraft,
    canShowGatingBanner,
    setCanShowGatingBanner,
    canShowTopicPermissionBanner,
    setCanShowTopicPermissionBanner,
  };
};

export default useNewThreadForm;
