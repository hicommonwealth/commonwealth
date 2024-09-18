import _ from 'lodash';
import moment from 'moment';
import { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';

import { MixpanelSnapshotEvents } from 'analytics/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { SnapshotSpace } from 'helpers/snapshot_utils';
import { getScore } from 'helpers/snapshot_utils';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import Thread from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  createDeltaFromText,
  ReactQuillEditor,
} from 'views/components/react_quill_editor';

import { createNewProposal, ThreadForm } from '../helpers';

import { getSnapshotSpaceQuery } from 'state/api/snapshots';
import './NewSnapshotProposalForm.scss';

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
  const [errorMessage, setErrorMessage] = useState(false);

  const { isAddedToHomeScreen } = useAppStatus();
  const user = useUserStore();

  const clearLocalStorage = () => {
    localStorage.removeItem(
      `${app.activeChainId()}-new-snapshot-proposal-name`,
    );
  };

  const handlePublish = async () => {
    try {
      setIsSaving(true);

      const content = JSON.stringify(contentDelta);
      // @ts-expect-error <StrictNullChecks/>
      const response = await createNewProposal(form, content, author, space);

      clearLocalStorage();
      trackAnalytics({
        event: MixpanelSnapshotEvents.SNAPSHOT_PROPOSAL_CREATED,
        isPWA: isAddedToHomeScreen,
      });
      notifySuccess('Snapshot Created!');
      // @ts-expect-error <StrictNullChecks/>
      navigate(`/snapshot/${space.id}`);

      if (onSave) {
        onSave({ id: response.id, snapshot_title: response.title }); // Pass relevant information
      }
    } catch (err) {
      err.code === 'ACTION_REJECTED'
        ? notifyError('User rejected signing')
        : notifyError(_.capitalize(err.error_description) || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
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

      if (thread && thread.body) {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/discussion/')) {
          const domain = window.location.origin;
          const communityId = app.activeChainId();
          const threadId = thread.id;

          // eslint-disable-next-line max-len
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

      const snapshotSpace = await getSnapshotSpaceQuery({
        space: snapshotId,
      });
      const scoreResponse = await getScore(
        snapshotSpace,
        user.activeAccount?.address || '',
      );
      const firstKey = Object.keys(scoreResponse?.[0])?.[0];
      setUserScore(scoreResponse[0][firstKey]);
      setSpace(snapshotSpace);
      setMembers(snapshotSpace.members);
      setSnapshotScoresFetched(true);
      setLoading(false);
    };

    init().catch(() => {
      setErrorMessage(true);
    });
  }, [snapshotId, thread, user.activeAccount?.address]);

  const author = user.activeAccount;

  const isMember =
    author &&
    author.address &&
    !!members.find(
      (member) => member.toLowerCase() === author.address.toLowerCase(),
    );

  const minScoreFromSpace =
    space?.validation?.params.minScore ?? space?.filters?.minScore; // Fall back to filters

  // @ts-expect-error <StrictNullChecks/>
  const hasMinScore = userScore >= minScoreFromSpace;

  const showScoreWarning =
    // @ts-expect-error <StrictNullChecks/>
    minScoreFromSpace > 0 && !hasMinScore && !isMember && userScore !== null;

  const isValid =
    !!space &&
    (!space.filters?.onlyMembers || (space.filters?.onlyMembers && isMember)) &&
    (minScoreFromSpace === 0 ||
      // @ts-expect-error <StrictNullChecks/>
      (minScoreFromSpace > 0 && userScore >= minScoreFromSpace) ||
      isMember);

  // Check if the space object is not null before rendering the form

  return (
    <div className="NewSnapshotProposalForm">
      {loading ? (
        errorMessage ? (
          <CWText className="error-text">
            Snapshot space not found. Check your Snapshot space name and try
            again.
          </CWText>
        ) : (
          <div className="proposal-loading">
            <CWCircleMultiplySpinner />
          </div>
        )
      ) : (
        <>
          {/* @ts-expect-error StrictNullChecks*/}
          {space.filters?.onlyMembers && !isMember && (
            <CWText>
              You need to be a member of the space in order to submit a
              proposal.
            </CWText>
          )}
          {showScoreWarning ? (
            <CWText>
              You need to have a minimum of {space!.validation.params.minScore}{' '}
              {/* @ts-expect-error StrictNullChecks*/}
              {space.symbol} in order to submit a proposal.
            </CWText>
          ) : (
            <CWText>
              {/* @ts-expect-error StrictNullChecks*/}
              You need to meet the minimum quorum of {space.symbol} in order to
              submit a proposal.
            </CWText>
          )}
          <CWTextInput
            label="Question/Proposal"
            placeholder="Should 0xMaki be our new Mayor?"
            onInput={(e) => {
              // @ts-expect-error <StrictNullChecks/>
              setForm({
                ...form,
                name: e.target.value,
              });
              localStorage.setItem(
                `${app.activeChainId()}-new-snapshot-proposal-name`,
                // @ts-expect-error <StrictNullChecks/>
                form.name,
              );
            }}
            // @ts-expect-error <StrictNullChecks/>
            defaultValue={form.name}
          />
          {/* @ts-expect-error StrictNullChecks*/}
          {form.choices.map((unused1, idx) => {
            return (
              <CWTextInput
                key={`choice-${idx}`}
                label={`Choice ${idx + 1}`}
                placeholder={
                  idx === 0 ? 'Yes' : idx === 1 ? 'No' : `Option ${idx + 1}`
                }
                onInput={(e) => {
                  // @ts-expect-error <StrictNullChecks/>
                  setForm({
                    ...form,
                    // @ts-expect-error <StrictNullChecks/>
                    choices: form.choices.map((choice, i) =>
                      i === idx ? e.target.value : choice,
                    ),
                  });
                }}
                iconRight={
                  // @ts-expect-error <StrictNullChecks/>
                  idx > 1 && idx === form.choices.length - 1
                    ? 'trash'
                    : undefined
                }
                iconRightonClick={() => {
                  // @ts-expect-error <StrictNullChecks/>
                  setForm({
                    ...form,
                    // @ts-expect-error <StrictNullChecks/>
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
                // @ts-expect-error <StrictNullChecks/>
                setForm({
                  ...form,
                  // @ts-expect-error <StrictNullChecks/>
                  choices: form.choices.concat(
                    // @ts-expect-error <StrictNullChecks/>
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
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handlePublish}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default NewSnapshotProposalForm;
