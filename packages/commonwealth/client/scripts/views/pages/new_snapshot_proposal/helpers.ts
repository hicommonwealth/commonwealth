import type { SnapshotSpace } from 'helpers/snapshot_utils';
import { createProposal, getSpaceBlockNumber } from 'helpers/snapshot_utils';
import type { Account } from 'models';
import app from 'state';
import type { QuillEditor } from '../../components/quill/quill_editor';
import type { ThreadForm } from './types';
import { NewThreadErrors } from './types';

// Don't call it a new thread if it ain't a new thread.
const newThread = async (
  form: ThreadForm,
  quillEditorState: QuillEditor,
  author: Account,
  space: SnapshotSpace
) => {
  if (!form.name) {
    throw new Error(NewThreadErrors.NoTitle);
  }

  if (!form.start) {
    throw new Error(NewThreadErrors.NoStartDate);
  }

  if (!form.end) {
    throw new Error(NewThreadErrors.NoEndDate);
  }

  if (!form.choices[0] || !form.choices[1]) {
    throw new Error(NewThreadErrors.NoChoices);
  }

  if (quillEditorState.isBlank()) {
    throw new Error(NewThreadErrors.NoBody);
  }

  quillEditorState.disable();

  const bodyText = quillEditorState.textContentsAsString;

  form.body = bodyText;

  form.snapshot = await getSpaceBlockNumber(space.network);
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  // Format form for proper validation
  delete form.range;
  const delay = space.voting.delay ?? 0;
  const period = space.voting.period ?? 432000; // 5 day default
  const timestamp = Math.floor(Date.now() / 1e3);
  form.start = timestamp + delay;
  form.end = form.start + period;

  const proposalPayload = {
    space: space.id,
    type: 'single-choice',
    title: form.name,
    body: form.body,
    choices: form.choices,
    start: form.start,
    end: form.end,
    snapshot: form.snapshot,
    network: '1', // TODO: unclear if this is always 1
    timestamp: timestamp,
    strategies: JSON.stringify({}),
    plugins: JSON.stringify({}),
    metadata: JSON.stringify({}),
  };

  try {
    await createProposal(author.address, proposalPayload);
    await app.user.notifications.refresh();
    await app.snapshot.refreshProposals();
  } catch (e) {
    console.log(e);
    throw new Error(e.error);
  }
};

export const newLink = async (
  form: ThreadForm,
  quillEditorState: QuillEditor,
  author: Account,
  space: SnapshotSpace
) => {
  const errors = await newThread(form, quillEditorState, author, space);
  console.log('the rro', errors);
  return errors;
};
