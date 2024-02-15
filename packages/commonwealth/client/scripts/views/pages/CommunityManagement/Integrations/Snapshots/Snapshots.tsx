import { notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import _ from 'underscore';
import { LinksArray, useLinksArray } from 'views/components/LinksArray';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './Snapshots.scss';
import { snapshotValidationSchema } from './validation';

const Snapshots = () => {
  const community = app.config.chains.getById(app.activeChainId());
  const [hasExistingSnapshots, setHasExistingSnapshots] = useState(
    community.snapshot.length > 0,
  );
  const {
    links: snapshots,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: (community.snapshot || []).map((x) => ({
      value: x,
      error: '',
      canDelete: true,
      canUpdate: true,
    })),
    linkValidation: snapshotValidationSchema,
  });

  const onSaveChanges = async () => {
    if (!areLinksValid()) return;

    try {
      // get unique snapshot names from links (if any value in array was link)
      const newSnapshots = [
        ...new Set(
          snapshots
            .map((x) => x.value)
            .map((link) => {
              const splitLink = link.split('/');
              const sanitizedLink = splitLink[splitLink.length - 1];
              return sanitizedLink;
            }),
        ),
      ];
      await community.updateChainData({
        snapshot: newSnapshots,
      });
      setLinks(
        newSnapshots.map((snapshot) => ({
          value: snapshot,
          error: '',
          canDelete: true,
          canUpdate: true,
        })),
      );

      notifySuccess('Snapshot links updated!');
      app.sidebarRedraw.emit('redraw');
      setHasExistingSnapshots(newSnapshots.length > 0);
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
            [...(community.snapshot || [])].sort((a, b) => a.localeCompare(b)),
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
