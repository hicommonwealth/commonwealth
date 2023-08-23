import React, { useState } from 'react';

import 'modals/linked_thread_modal.scss';

import { notifyError } from 'controllers/app/notifications';
import { getAddedAndDeleted } from 'helpers/threads';
import { Link, LinkSource } from 'models/Thread';
import app from 'state';
import {
  useAddThreadLinksMutation,
  useDeleteThreadLinksMutation,
} from 'state/api/threads';
import { ThreadSelector } from 'views/components/thread_selector';
import type Thread from '../../models/Thread';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { UrlSelector } from '../components/url_link_selector/url_selector';

type LinkedUrlModalProps = {
  urlLinks: Link[];
  thread: Thread;
  onModalClose: () => void;
  onSave?: (links: Thread['links']) => void;
};

export const LinkedUrlModal = ({
  thread,
  urlLinks: initialUrlLinks = [],
  onModalClose,
  onSave,
}: LinkedUrlModalProps) => {
  const [newTitle, setNewTitle] = useState<string>(null);
  const [newUrl, setNewUrl] = useState<string>(null);
  const [tempLinkedUrls, setTempLinkedUrls] =
    useState<Array<Link>>(initialUrlLinks);

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const handleSaveChanges = async () => {
    const { toAdd, toDelete } = getAddedAndDeleted(
      tempLinkedUrls,
      initialUrlLinks,
      'identifier'
    );

    let links: Thread['links'];

    try {
      if (toAdd.length) {
        const updatedThread = await addThreadLinks({
          chainId: app.activeChainId(),
          threadId: thread.id,
          links: toAdd.map((el) => ({
            source: LinkSource.Web,
            identifier: String(el.identifier),
            title: el.title,
          })),
        });

        links = updatedThread.links;
      }
      if (toDelete.length) {
        const updatedThread = await deleteThreadLinks({
          chainId: app.activeChainId(),
          threadId: thread.id,
          links: toDelete.map((el) => ({
            source: LinkSource.Web,
            identifier: String(el.identifier),
          })),
        });

        links = updatedThread.links;
      }

      onModalClose();

      if (links && onSave) {
        onSave(links);
      }
    } catch (err) {
      console.error(err);
      notifyError('Failed to update linked threads');
      onModalClose();
    }
  };

  const handleSelectThread = (selectedUrl: Link) => {
    const isSelected = tempLinkedUrls.find(
      ({ identifier }) => selectedUrl.identifier === identifier
    );

    const updatedLinkedUrls = isSelected
      ? tempLinkedUrls.filter(
          ({ identifier }) => selectedUrl.identifier !== identifier
        )
      : [...tempLinkedUrls, selectedUrl];

    setTempLinkedUrls(updatedLinkedUrls);
  };

  const handleAddThread = () => {
    //ensure link is a url
    const newLink: Link = {
      source: LinkSource.Web,
      identifier: newUrl,
      title: newTitle,
    };
    setTempLinkedUrls([...tempLinkedUrls, newLink]);
    setNewTitle('');
    setNewUrl('');
  };

  return (
    <div className="LinkedThreadModal">
      <div className="compact-modal-title">
        <h3>Add Webpage Links</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <div className="link-input">
          <CWTextInput
            placeholder="https://..."
            value={newUrl}
            onInput={(e) => setNewUrl(e.target.value)}
          />
          <CWTextInput
            placeholder="Title"
            value={newTitle}
            onInput={(e) => setNewTitle(e.target.value)}
          />
          <CWIconButton iconName="plus" onClick={handleAddThread} />
        </div>
        <UrlSelector urlsToSet={tempLinkedUrls} onSelect={handleSelectThread} />

        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onModalClose}
          />
          <CWButton label="Save changes" onClick={handleSaveChanges} />
        </div>
      </div>
    </div>
  );
};
