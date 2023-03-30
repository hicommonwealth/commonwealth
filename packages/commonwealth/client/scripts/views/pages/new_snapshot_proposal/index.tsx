import React, { FormEvent, SyntheticEvent, useEffect, useMemo, useState } from 'react';

import { parsePathname } from 'mithrilInterop';
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

import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import type { ThreadForm } from './types';
import withRouter, { useCommonNavigate } from 'navigation/helpers';
import { useLocation } from 'react-router';
import { createDeltaFromText, ReactQuillEditor } from '../../components/react_quill_editor';
import { DeltaStatic } from 'quill';
import { createNewProposal } from './helpers';

type NewSnapshotProposalPageProps = {
  snapshotId: string;
};

export const NewSnapshotProposalPageComponent = ({ snapshotId }: NewSnapshotProposalPageProps) => {
  const navigate = useCommonNavigate();

  const [form, setForm] = useState<ThreadForm | null>(null);
  const [isFromExistingProposal, setIsFromExistingProposal] = useState<boolean>();
  const [members, setMembers] = useState<string[]>([]);
  const [contentDelta, setContentDelta] = useState<DeltaStatic>(createDeltaFromText(''));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snapshotScoresFetched, setSnapshotScoresFetched] = useState<boolean>(false);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [userScore, setUserScore] = useState<number>(0);

  const location = useLocation();
  const pathVars = useMemo(() => {
    return parsePathname(window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const clearLocalStorage = () => {
    localStorage.removeItem(`${app.activeChainId()}-new-snapshot-proposal-name`);
  };

  const handlePublish = async () => {
    try {
      setIsSaving(true);

      const content = JSON.stringify(contentDelta);
      await createNewProposal(form, content, author, space);

      clearLocalStorage();
      notifySuccess('Snapshot Created!');
      navigate(`/snapshot/${space.id}`);
    } catch (err) {
      notifyError(capitalize(err.message));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await app.snapshot.init(snapshotId);

      if (!app.snapshot.initialized) {
        return;
      }

      const initialForm: ThreadForm = {
        name: '',
        body: '',
        choices: ['Yes', 'No'],
        range: '5d',
        start: new Date().getTime(),
        end: moment().add(5, 'days').toDate().getTime(),
        snapshot: 0,
        metadata: {},
        type: 'single-choice'
      };

      if (pathVars.params.fromProposalType && pathVars.params.fromProposalId) {
        const fromProposalId =
          typeof pathVars.params.fromProposalId === 'number'
            ? pathVars.params.fromProposalId
            : pathVars.params.fromProposalId.toString();

        const fromProposalType = pathVars.params.fromProposalType.toString();

        const fromProposal = idToProposal(fromProposalType, fromProposalId);

        initialForm.name = fromProposal.title;

        setIsFromExistingProposal(true);

        if (fromProposal.body) {
          try {
            const parsedBody = JSON.parse(fromProposal.body);
            initialForm.body = parsedBody.ops[0].insert;
          } catch (e) {
            console.error(e);
          }
        }
      }

      setForm(initialForm);

      const snapshotSpace = app.snapshot.space;
      console.log('snapshotSpace: ', snapshotSpace);
      const scoreResponse = await getScore(snapshotSpace, app.user.activeAccount.address);
      setUserScore(scoreResponse);
      setSpace(snapshotSpace);
      setMembers(snapshotSpace.members);
      setSnapshotScoresFetched(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!form || !snapshotScoresFetched) return <PageLoading />;

  const author = app.user.activeAccount;

  const isMember =
    author && author.address && !!members.find((member) => member.toLowerCase() === author.address.toLowerCase());

  const hasMinScore = userScore >= space.filters?.minScore;

  const showScoreWarning = space.filters?.minScore > 0 && !hasMinScore && !isMember && userScore !== null;

  const isValid =
    !!space &&
    (!space.filters?.onlyMembers || (space.filters?.onlyMembers && isMember)) &&
    (space.filters?.minScore === 0 || (space.filters?.minScore > 0 && userScore > space.filters?.minScore) || isMember);

  return (
    <Sublayout>
      <div className="NewSnapshotProposalPage">
        <CWText type="h3" fontWeight="medium">
          New Snapshot Proposal
        </CWText>
        {space.filters?.onlyMembers && !isMember && (
          <CWText>You need to be a member of the space in order to submit a proposal.</CWText>
        )}
        {showScoreWarning ? (
          <CWText>
            You need to have a minimum of {space.filters.minScore} {space.symbol} in order to submit a proposal.
          </CWText>
        ) : (
          <CWSpinner />
        )}
        <CWTextInput
          label="Question/Proposal"
          placeholder="Should 0xMaki be our new Mayor?"
          onInput={(e) => {
            setForm({
              ...form,
              name: e.target.value
            });
            localStorage.setItem(`${app.activeChainId()}-new-snapshot-proposal-name`, form.name);
          }}
          defaultValue={form.name}
        />
        {form.choices.map((_, idx) => {
          return (
            <CWTextInput
              label={`Choice ${idx + 1}`}
              placeholder={idx === 0 ? 'Yes' : idx === 1 ? 'No' : `Option ${idx + 1}`}
              onInput={(e) => {
                setForm({
                  ...form,
                  choices: form.choices.map((choice, i) => (i === idx ? e.target.value : choice))
                });
              }}
              iconRight={idx > 1 && idx === form.choices.length - 1 ? 'trash' : undefined}
              iconRightonClick={() => {
                setForm({
                  ...form,
                  choices: form.choices.slice(0, -1)
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
              choices: form.choices.concat(`Option ${form.choices.length + 1}`)
            });
          }}
        />
        <div className="date-range">
          <CWLabel label="Date Range" />
          <CWRadioGroup
            name="period"
            options={[{ value: '4d', label: '4-day' }]}
            toggledOption="4d"
            onChange={(e: FormEvent<HTMLInputElement>) => {
              const values: Partial<ThreadForm> = {
                range: e.currentTarget.value,
                start: new Date().getTime()
              };

              if (form.range === '4d') {
                form.end = moment().add(4, 'days').toDate().getTime();
              }

              setForm({
                ...form,
                ...values
              });
            }}
          />
        </div>
        <ReactQuillEditor
          contentDelta={contentDelta}
          setContentDelta={setContentDelta}
          placeholder={'What is your proposal?'}
        />
        <CWButton label="Publish" disabled={!author || isSaving || !isValid} onClick={handlePublish} />
      </div>
    </Sublayout>
  );
};

const NewSnapshotProposalPage = withRouter(NewSnapshotProposalPageComponent);

export default NewSnapshotProposalPage;
