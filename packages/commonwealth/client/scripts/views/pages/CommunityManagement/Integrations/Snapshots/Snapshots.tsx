import { notifySuccess } from 'controllers/app/notifications';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import _ from 'underscore';
import { LinksArray, useLinksArray } from 'views/components/LinksArray';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './Snapshots.scss';
import { snapshotValidationSchema } from './validation';

import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
const Snapshots = () => {
  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
    });

  useRunOnceOnCondition({
    callback: () => {
      setLinks(
        (community?.snapshot_spaces || []).map((x) => ({
          value: x,
          error: '',
          canDelete: true,
          canUpdate: true,
        })),
      );
    },
    shouldRun: !isLoadingCommunity && !!community,
  });

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: community?.id || '',
  });

  const hasExistingSnapshots = (community?.snapshot_spaces || [])?.length > 0;
  const {
    links: snapshots,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: [],
    linkValidation: snapshotValidationSchema,
  });

  const onSaveChanges = async () => {
    if (!areLinksValid() || !community?.id) return;

    try {
      // get unique snapshot names from links (if any value in array was link)
      const newSnapshots = [
        ...new Set(
          snapshots
            .map((x) => x.value)
            .map((link) => {
              const splitLink = link.split('/');
              return splitLink[splitLink.length - 1];
            }),
        ),
      ];

      await updateCommunity(
        buildUpdateCommunityInput({
          communityId: community?.id,
          snapshot: newSnapshots,
        }),
      );

      setLinks(
        newSnapshots.map((snapshot) => ({
          value: snapshot,
          error: '',
          canDelete: true,
          canUpdate: true,
        })),
      );

      notifySuccess('Snapshot links updated!');
    } catch {
      notifySuccess('Failed to update snapshot links!');
    }
  };

  return (
    <section className="Snapshots">
      <div className="header">
        <CWText type="h4">Snapshot</CWText>
        <CWText type="b1">
          You can connect multiple Snapshot spaces to keep your voting
          conversations all in one place.
        </CWText>
      </div>

      {snapshots.length > 0 && (
        <LinksArray
          label="Snapshot Space"
          addLinkButtonCTA="+ Add Snapshot Space"
          placeholder="examplesnapshotspace.eth"
          links={snapshots}
          onLinkAdd={onLinkAdd}
          onLinkUpdatedAtIndex={onLinkUpdatedAtIndex}
          onLinkRemovedAtIndex={onLinkRemovedAtIndex}
        />
      )}

      {hasExistingSnapshots || snapshots.length > 0 ? (
        <CWButton
          buttonType="secondary"
          label="Save Changes"
          disabled={_.isEqual(
            [...snapshots.map((x) => x.value.trim())].sort((a, b) =>
              a.localeCompare(b),
            ),
            [...(community?.snapshot_spaces || [])].sort((a, b) =>
              a.localeCompare(b),
            ),
          )}
          onClick={onSaveChanges}
        />
      ) : (
        <CWButton
          buttonType="secondary"
          label="Add Snapshot"
          onClick={onLinkAdd}
        />
      )}
    </section>
  );
};

export default Snapshots;
