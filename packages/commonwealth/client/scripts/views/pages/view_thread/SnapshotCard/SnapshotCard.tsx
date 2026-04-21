import type Thread from 'client/scripts/models/Thread';
import app from 'client/scripts/state';
import Permissions from 'client/scripts/utils/Permissions';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React, { useState } from 'react';
import { ParticipationPromoCard } from '../ParticipationPromoCard';
import '../poll_cards.scss';
import { CreateSnapshot } from './CreateSnapshot';

export type SnapshotCardProps = {
  thread: Thread;
  onSnapshotSaved: (snapshotInfo: {
    id: string;
    snapshot_title: string;
  }) => void;
};

export const SnapshotCard = ({
  thread,
  onSnapshotSaved,
}: SnapshotCardProps) => {
  const [createOpen, setCreateOpen] = useState(false);

  const isAuthor = !!thread && Permissions.isThreadAuthor(thread);
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const canCreateSnapshotProposal =
    (app.chain?.meta?.snapshot_spaces?.length ?? 0) > 0 &&
    (isAuthor || isAdminOrMod);

  const hasSnapshotProposal = thread?.links?.find(
    (x) => x.source === 'snapshot',
  );

  const showAdminPromo =
    isAdminOrMod && !!canCreateSnapshotProposal && !hasSnapshotProposal;

  const showAuthorCreationCard =
    !showAdminPromo &&
    !!canCreateSnapshotProposal &&
    !hasSnapshotProposal &&
    (isAuthor || isAdminOrMod);

  const needsSnapshotCreateModal = showAdminPromo || showAuthorCreationCard;

  if (!needsSnapshotCreateModal) {
    return null;
  }

  return (
    <>
      {showAdminPromo && (
        <>
          <ParticipationPromoCard
            title="Snapshots"
            description="Link a Snapshot vote to this thread so governance stays in context."
            ctaLabel="Create Snapshot"
            onCtaClick={() => setCreateOpen(true)}
          />
        </>
      )}
      {showAuthorCreationCard && (
        <div className="PollEditorCard">
          <CWButton
            buttonHeight="sm"
            className="create-poll-button"
            label="Create Snapshot"
            onClick={(e) => {
              e.preventDefault();
              setCreateOpen(true);
            }}
          />
        </div>
      )}
      {needsSnapshotCreateModal && (
        <CreateSnapshot
          thread={thread}
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSnapshotSaved={onSnapshotSaved}
        />
      )}
    </>
  );
};
