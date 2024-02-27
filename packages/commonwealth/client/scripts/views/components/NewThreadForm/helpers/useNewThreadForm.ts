import type { DeltaStatic } from 'quill';
import { useEffect, useMemo, useState } from 'react';

import { useDraft } from 'hooks/useDraft';
import { useSearchParams } from 'react-router-dom';
import type Topic from '../../../../models/Topic';
import { ThreadKind } from '../../../../models/types';
import { getTextFromDelta } from '../../react_quill_editor';

type NewThreadDraft = {
  topicId: number;
  title: string;
  body: DeltaStatic;
};

const useNewThreadForm = (communityId: string, topicsForSelector: Topic[]) => {
  const [searchParams] = useSearchParams();
  const topicIdFromUrl: number = parseInt(searchParams.get('topic') || '0');

  const { saveDraft, restoreDraft, clearDraft } = useDraft<NewThreadDraft>(
    `new-thread-${communityId}-info`,
  );
  const [canShowGatingBanner, setCanShowGatingBanner] = useState(true);

  // get restored draft on init
  const restoredDraft: NewThreadDraft | null = useMemo(() => {
    if (!topicsForSelector.length || topicIdFromUrl === 0) {
      return null;
    }
    return restoreDraft();
  }, [restoreDraft, topicsForSelector, topicIdFromUrl]);

  const defaultTopic = useMemo(() => {
    return (
      topicsForSelector.find(
        (t) =>
          t.id === restoredDraft?.topicId ||
          (topicIdFromUrl && t.id === topicIdFromUrl),
      ) ||
      topicsForSelector.find((t) => t.name.includes('General')) ||
      null
    );
  }, [restoredDraft, topicsForSelector, topicIdFromUrl]);

  const [threadKind, setThreadKind] = useState<ThreadKind>(
    ThreadKind.Discussion,
  );
  const [threadUrl, setThreadUrl] = useState('');
  const [threadTopic, setThreadTopic] = useState<Topic>(defaultTopic);
  const [threadTitle, setThreadTitle] = useState(restoredDraft?.title || '');
  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    restoredDraft?.body,
  );
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

    if (!threadTopic && defaultTopic) {
      setThreadTopic(defaultTopic);
    }
  }, [saveDraft, threadTopic, threadTitle, threadContentDelta, defaultTopic]);

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
  };
};

export default useNewThreadForm;
