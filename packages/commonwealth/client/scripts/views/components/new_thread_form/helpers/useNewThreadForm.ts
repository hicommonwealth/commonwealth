import type { DeltaStatic } from 'quill';
import { useState } from 'react';
import { ThreadKind } from '../../../../models/types';

import { getTextFromDelta } from '../../react_quill_editor';

const useNewThreadForm = (authorName: string, hasTopics: boolean) => {
  const [threadKind, setThreadKind] = useState<ThreadKind>(
    ThreadKind.Discussion
  );
  const [threadTitle, setThreadTitle] = useState('');
  const [threadTopic, setThreadTopic] = useState<Topic>(null);
  const [threadUrl, setThreadUrl] = useState('');
  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>();
  const [isSaving, setIsSaving] = useState(false);

  const editorText = getTextFromDelta(threadContentDelta);

  const isDiscussion = threadKind === ThreadKind.Discussion;
  const disableSave = !authorName || isSaving;
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
  };
};

export default useNewThreadForm;
