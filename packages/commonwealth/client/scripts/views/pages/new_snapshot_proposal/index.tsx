import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { SnapshotSpace } from 'helpers/snapshot_utils';
import { getScore } from 'helpers/snapshot_utils';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { idToProposal } from 'identifiers';
import { capitalize } from 'lodash';
import Thread from 'models/Thread';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/new_snapshot_proposal.scss';
import { DeltaStatic } from 'quill';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import app from 'state';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { MixpanelSnapshotEvents } from '../../../../../shared/analytics/types';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  ReactQuillEditor,
  createDeltaFromText,
} from '../../components/react_quill_editor';
import { createNewProposal } from './helpers';
import type { ThreadForm } from './types';

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
  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  const [form, setForm] = useState<ThreadForm | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [contentDelta, setContentDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [, setSnapshotScoresFetched] = useState<boolean>(false);
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
      `${app.activeChainId()}-new-snapshot-proposal-name`,
    );
  };

  const handlePublish = async () => {
    try {
      setIsSaving(true);

      const content = JSON.stringify(contentDelta);
      const response = await createNewProposal(form, content, author, space);

      clearLocalStorage();
      trackAnalytics({
        event: MixpanelSnapshotEvents.SNAPSHOT_PROPOSAL_CREATED,
      });
      notifySuccess('Snapshot Created!');
      navigate(`/snapshot/${space.id}`);

      if (onSave) {
        onSave({ id: response.id, snapshot_title: response.title }); // Pass relevant information
      }
    } catch (err) {
      err.code === 'ACTION_REJECTED'
        ? notifyError('User rejected signing')
        : notifyError(capitalize(err.error_description));
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
        body: !thread ? '' : thread.plaintext,
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
        const currentPath = window.location.pathname;
        if (currentPath.includes('/discussion/')) {
          const domain = window.location.origin;
          const communityId = app.activeChainId();
          const threadId = thread.id;

          const linkText = `\n\nThis conversation was started on Commonwealth. Any attached images have been removed. See more discussion: `;
          const linkUrl = `\n${domain}/${communityId}/discussion/${threadId}`;

          const linkMarkdown = `${linkText}[here](${linkUrl})`;

          const delta = createDeltaFromText(
            thread.plaintext + linkMarkdown,
            true,
          );
          setContentDelta(delta);
        } else {
          const delta = createDeltaFromText(thread.plaintext);
          setContentDelta(delta);
        }
      }

      setForm(initialForm);

      const snapshotSpace = app.snapshot.space;
      const scoreResponse = await getScore(
        snapshotSpace,
        app.user.activeAccount.address,
      );
      setUserScore(scoreResponse);
      setSpace(snapshotSpace);
      setMembers(snapshotSpace.members);
      setSnapshotScoresFetched(true);
      setLoading(false);
    };

    init();
    app.snapshot.snapshotEmitter.on('initialized', handleInitialized);

    return () => {
      app.snapshot.snapshotEmitter.off('initialized', handleInitialized);
    };
  }, []);

  const author = app.user.activeAccount;

  const isMember =
    author &&
    author.address &&
    !!members.find(
      (member) => member.toLowerCase() === author.address.toLowerCase(),
    );

  const minScoreFromSpace =
    space?.validation?.params.minScore ?? space?.filters?.minScore; // Fall back to filters

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
      {loading ? (
        <div className="proposal-loading">
          <CWCircleMultiplySpinner />
        </div>
      ) : (
        <>
          {space.filters?.onlyMembers && !isMember && (
            <CWText>
              You need to be a member of the space in order to submit a
              proposal.
            </CWText>
          )}
          {showScoreWarning ? (
            <CWText>
              You need to have a minimum of {space.filters.minScore}{' '}
              {space.symbol} in order to submit a proposal.
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
                form.name,
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
                      i === idx ? e.target.value : choice,
                    ),
                  });
                }}
                iconRight={
                  idx > 1 && idx === form.choices.length - 1
                    ? 'trash'
                    : undefined
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
          <div className="add-voting-btn">
            <CWButton
              iconLeft="plus"
              buttonType="primary"
              buttonHeight="sm"
              label="Add voting choice"
              onClick={() => {
                setForm({
                  ...form,
                  choices: form.choices.concat(
                    `Option ${form.choices.length + 1}`,
                  ),
                });
              }}
            />
          </div>
          <ReactQuillEditor
            contentDelta={contentDelta}
            setContentDelta={setContentDelta}
            placeholder="What is your proposal?"
          />
          <div className="footer">
            {onModalClose && (
              <CWButton
                buttonHeight="sm"
                buttonType="secondary"
                label="Cancel"
                onClick={onModalClose}
              />
            )}
            <CWButton
              buttonHeight="sm"
              label="Publish"
              disabled={!author || isSaving || !isValid}
              onClick={handlePublish}
            />
          </div>
        </>
      )}
    </div>
  );
};
export default NewSnapshotProposalForm;
