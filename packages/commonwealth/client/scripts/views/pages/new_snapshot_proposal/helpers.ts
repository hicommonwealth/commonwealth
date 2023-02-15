import type {SnapshotSpace} from 'helpers/snapshot_utils';
import {createProposal, getSpaceBlockNumber} from 'helpers/snapshot_utils';
import app from 'state';
import type {QuillEditor} from '../../components/quill/quill_editor';
import type {ThreadForm} from './types';
import {NewThreadErrors} from './types';
import AddressAccount from "models/AddressAccount";

// Don't call it a new thread if it ain't a new thread.
const newThread = async (
  form: ThreadForm,
  quillEditorState: QuillEditor,
  author: AddressAccount,
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

  form.body = quillEditorState.textContentsAsString;

  form.snapshot = await getSpaceBlockNumber(space.network);
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  // Format form for proper validation
  delete form.range;
  form.start = Math.floor(form.start / 1000);
  form.end = Math.floor(form.end / 1000);

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
    timestamp: Math.floor(Date.now() / 1e3),
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
  author: AddressAccount,
  space: SnapshotSpace
) => {
  const errors = await newThread(form, quillEditorState, author, space);
  console.log('the rro', errors);
  return errors;
};
