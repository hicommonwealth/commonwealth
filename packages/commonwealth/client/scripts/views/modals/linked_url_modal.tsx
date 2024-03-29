import React, { useState } from 'react';

import { notifyError } from 'controllers/app/notifications';
import { getAddedAndDeleted } from 'helpers/threads';
import { Link, LinkSource } from 'models/Thread';
import app from 'state';
import {
  useAddThreadLinksMutation,
  useDeleteThreadLinksMutation,
} from 'state/api/threads';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import type Thread from '../../models/Thread';
import { UrlSelector } from '../components/UrlLinkSelector/UrlSelector';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';

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
    communityId: app.activeChainId(),
    threadId: thread.id,
  });

  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
  });

  const handleSaveChanges = async () => {
    const { toAdd, toDelete } = getAddedAndDeleted(
      tempLinkedUrls,
      initialUrlLinks,
      'identifier',
    );
    let links: Thread['links'];

    try {
      if (toAdd.length) {
        const updatedThread = await addThreadLinks({
          communityId: app.activeChainId(),
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
          communityId: app.activeChainId(),
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
      ({ identifier }) => selectedUrl.identifier === identifier,
    );

    const updatedLinkedUrls = isSelected
      ? tempLinkedUrls.filter(
          ({ identifier }) => selectedUrl.identifier !== identifier,
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

  const disableAdd =
    !newUrl?.startsWith('https://') ||
    !newUrl.includes('.') ||
    newTitle == '' ||
    newTitle == null;

  return (
    <div className="LinkedUrlModal">
      <CWModalHeader onModalClose={onModalClose} label="Add external links" />
      <CWModalBody>
        <CWText>New link details</CWText>
        <CWTextInput
          placeholder="https://..."
          value={newUrl}
          onInput={(e) => setNewUrl(e.target.value)}
          containerClassName="input-label"
          inputValidationFn={(e) => {
            if (!e.startsWith('https://') || !newUrl.includes('.')) {
              return ['failure', 'Must be a valid link'];
            } else {
              return ['success', 'Input validated'];
            }
          }}
        />
        <CWTextInput
          placeholder="Title"
          value={newTitle}
          onInput={(e) => setNewTitle(e.target.value)}
        />
        <CWButton
          label="Add link"
          iconLeft="plusCircle"
          disabled={disableAdd}
          onClick={handleAddThread}
          buttonHeight="sm"
          buttonType="secondary"
        />
        <UrlSelector urlsToSet={tempLinkedUrls} onSelect={handleSelectThread} />
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonHeight="sm"
          buttonType="secondary"
          onClick={onModalClose}
        />
        <CWButton
          buttonHeight="sm"
          label="Save changes"
          onClick={handleSaveChanges}
        />
      </CWModalFooter>
    </div>
  );
};
