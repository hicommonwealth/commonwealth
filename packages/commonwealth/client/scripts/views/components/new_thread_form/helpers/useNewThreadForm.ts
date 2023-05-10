import { useEffect, useMemo, useState } from 'react';
import type { DeltaStatic } from 'quill';

import type { Topic } from 'models';
import { ThreadKind } from 'models';
import { getTextFromDelta } from '../../react_quill_editor';
import { useDraft } from 'hooks/useDraft';

type NewThreadDraft = {
  topicId: number;
  title: string;
  body: DeltaStatic;
};

const useNewThreadForm = (
  chainId: string,
  authorName: string,
  topicsForSelector: Topic[]
) => {
  const { saveDraft, restoreDraft, clearDraft } = useDraft<NewThreadDraft>(
    `new-thread-${chainId}-info`
  );

  // get restored draft on init
  const restoredDraft: NewThreadDraft | null = useMemo(() => {
    if (!topicsForSelector.length) {
      return null;
    }
    return restoreDraft();
  }, [restoreDraft, topicsForSelector]);

  const defaultTopic = useMemo(() => {
    return (
      topicsForSelector.find((t) => t.id === restoredDraft?.topicId) ||
      topicsForSelector.find((t) => t.name.includes('General')) ||
      null
    );
  }, [restoredDraft, topicsForSelector]);

  const [threadKind, setThreadKind] = useState<ThreadKind>(
    ThreadKind.Discussion
  );
  const [threadUrl, setThreadUrl] = useState('');
  const [threadTopic, setThreadTopic] = useState<Topic>(defaultTopic);
  const [threadTitle, setThreadTitle] = useState(restoredDraft?.title || '');
  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    restoredDraft?.body
  );
  const [isSaving, setIsSaving] = useState(false);

  const editorText = getTextFromDelta(threadContentDelta);

  const isDiscussion = threadKind === ThreadKind.Discussion;
  const disableSave = !authorName || isSaving;
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
  }, [saveDraft, threadTopic, threadTitle, threadContentDelta]);

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
  };
};

export default useNewThreadForm;
