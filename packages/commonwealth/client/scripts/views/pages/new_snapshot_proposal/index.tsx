import React, { FormEvent, useEffect, useMemo, useState } from 'react';

import moment from 'moment';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { SnapshotSpace } from 'helpers/snapshot_utils';
import { getScore } from 'helpers/snapshot_utils';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
import 'pages/new_snapshot_proposal.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

import Sublayout from '../../Sublayout';
import { PageLoading } from '../loading';
import type { ThreadForm } from './types';
import { useCommonNavigate } from 'navigation/helpers';
import { useLocation } from 'react-router';
import {
  createDeltaFromText,
  ReactQuillEditor,
} from '../../components/react_quill_editor';
import { DeltaStatic } from 'quill';
import { createNewProposal } from './helpers';
import Thread from 'client/scripts/models/Thread';

type NewSnapshotProposalPageProps = {
  snapshotId: string;
};

type NewSnapshotProposalFormProps = {
  snapshotId: string;
  thread?: Thread;
  onSave?: (snapshotInfo: { id: string; snapshot_title: string }) => void;
  onModalClose?: () => void;
};

export const NewSnapshotProposalForm = ({
  snapshotId,
  thread,
  onSave,
  onModalClose,
}: NewSnapshotProposalFormProps) => {
  const navigate = useCommonNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState<ThreadForm | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [contentDelta, setContentDelta] = useState<DeltaStatic>(
    createDeltaFromText('')
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snapshotScoresFetched, setSnapshotScoresFetched] =
    useState<boolean>(false);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [userScore, setUserScore] = useState<number>(0);

  const location = useLocation();
  const pathVars = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const params: Record<string, any> = {};
    for (const [key, value] of search) {
      params[key] = value;
    }
    return params;
  }, [location]);

  const clearLocalStorage = () => {
    localStorage.removeItem(
      `${app.activeChainId()}-new-snapshot-proposal-name`
    );
  };

  const handlePublish = async () => {
    try {
      setIsSaving(true);

      const content = JSON.stringify(contentDelta);
      const response = await createNewProposal(form, content, author, space);

      clearLocalStorage();
      notifySuccess('Snapshot Created!');
      navigate(`/snapshot/${space.id}`);

      if (onSave) {
        onSave({ id: response.id, snapshot_title: response.title }); // Pass relevant information
      }
    } catch (err) {
      notifyError(capitalize(err.message));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await app.snapshot.init(snapshotId);
    };

    // Add event listener for SnapshotController
    const handleInitialized = async () => {
      if (!app.snapshot.initialized) {
        return;
      }

      const initialForm: ThreadForm = {
        name: !thread ? '' : thread.title,
        body: !thread ? '' : thread.body,
        choices: ['Yes', 'No'],
        range: '5d',
        start: new Date().getTime(),
        end: moment().add(5, 'days').toDate().getTime(),
        snapshot: 0,
        metadata: {},
        type: 'single-choice',
      };

      if (pathVars.fromProposalType && pathVars.fromProposalId) {
        const fromProposalId =
          typeof pathVars.fromProposalId === 'number'
            ? pathVars.fromProposalId
            : pathVars.fromProposalId.toString();

        const fromProposalType = pathVars.fromProposalType.toString();

        const fromProposal = idToProposal(fromProposalType, fromProposalId);

        initialForm.name = fromProposal.title;

        if (fromProposal.body) {
          try {
            const parsedBody = JSON.parse(fromProposal.body);
            initialForm.body = parsedBody.ops[0].insert;
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (thread && thread.body) {
        const delta = createDeltaFromText(thread.plaintext);
        setContentDelta(delta);
      }

      setForm(initialForm);

      const snapshotSpace = app.snapshot.space;
      const scoreResponse = await getScore(
        snapshotSpace,
        app.user.activeAccount.address
      );
      setUserScore(scoreResponse);
      setSpace(snapshotSpace);
      setMembers(snapshotSpace.members);
      setSnapshotScoresFetched(true);
      setLoading(false);
      // Set loading to false after initialization is complete
    };

    app.snapshot.snapshotEmitter.on('initialized', handleInitialized);
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps

    // Clean up the event listener when the component is unmounted
    return () => {
      app.snapshot.snapshotEmitter.off('initialized', handleInitialized);
    };
  }, []);

  if (loading) return <CWSpinner />;

  const author = app.user.activeAccount;

  const isMember =
    author &&
    author.address &&
    !!members.find(
      (member) => member.toLowerCase() === author.address.toLowerCase()
    );

  const minScoreFromSpace =
    space.validation?.params.minScore ?? space.filters?.minScore; // Fall back to filters

  const hasMinScore = userScore >= minScoreFromSpace;

  const showScoreWarning =
    minScoreFromSpace > 0 && !hasMinScore && !isMember && userScore !== null;

  const isValid =
    !!space &&
    (!space.filters?.onlyMembers || (space.filters?.onlyMembers && isMember)) &&
    (minScoreFromSpace === 0 ||
      (minScoreFromSpace > 0 && userScore > minScoreFromSpace) ||
      isMember);

  // Check if the space object is not null before rendering the form

  return (
    <div className="NewSnapshotProposalForm">
      {space.filters?.onlyMembers && !isMember && (
        <CWText>
          You need to be a member of the space in order to submit a proposal.
        </CWText>
      )}
      {showScoreWarning ? (
        <CWText>
          You need to have a minimum of {space.filters.minScore} {space.symbol}{' '}
          in order to submit a proposal.
        </CWText>
      ) : (
        <CWText>
          You need to meet the minimum quorum of {space.symbol} in order to
          submit a proposal.
        </CWText>
      )}
      <CWTextInput
        label="Question/Proposal"
        placeholder="Should 0xMaki be our new Mayor?"
        onInput={(e) => {
          setForm({
            ...form,
            name: e.target.value,
          });
          localStorage.setItem(
            `${app.activeChainId()}-new-snapshot-proposal-name`,
            form.name
          );
        }}
        defaultValue={form.name}
      />
      {form.choices.map((_, idx) => {
        return (
          <CWTextInput
            key={`choice-${idx}`}
            label={`Choice ${idx + 1}`}
            placeholder={
              idx === 0 ? 'Yes' : idx === 1 ? 'No' : `Option ${idx + 1}`
            }
            onInput={(e) => {
              setForm({
                ...form,
                choices: form.choices.map((choice, i) =>
                  i === idx ? e.target.value : choice
                ),
              });
            }}
            iconRight={
              idx > 1 && idx === form.choices.length - 1 ? 'trash' : undefined
            }
            iconRightonClick={() => {
              setForm({
                ...form,
                choices: form.choices.slice(0, -1),
              });
            }}
          />
        );
      })}
      <CWButton
        iconLeft="plus"
        label="Add voting choice"
        onClick={() => {
          setForm({
            ...form,
            choices: form.choices.concat(`Option ${form.choices.length + 1}`),
          });
        }}
      />
      <ReactQuillEditor
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
        placeholder={'What is your proposal?'}
      />
      <CWButton
        label="Publish"
        disabled={!author || isSaving || !isValid}
        onClick={handlePublish}
      />
    </div>
  );
};

const NewSnapshotProposalPageComponent = ({
  snapshotId,
}: NewSnapshotProposalPageProps) => {
  return (
    <Sublayout>
      <div className="NewSnapshotProposalPage">
        <CWText type="h3" fontWeight="medium">
          New Snapshot Proposal
        </CWText>
        <NewSnapshotProposalForm snapshotId={snapshotId} />
      </div>
    </Sublayout>
  );
};

const NewSnapshotProposalPage = NewSnapshotProposalPageComponent;

export default NewSnapshotProposalPage;
