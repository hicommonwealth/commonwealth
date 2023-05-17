import React, { useState } from 'react';

import 'modals/template_action_modal.scss';

import app from 'state';
import Thread, { Link, LinkSource } from '../../models/Thread';
import { getAddedAndDeleted } from '../../helpers/threads';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { TemplateSelector } from '../components/template_action_selector';
import { CWButton } from '../components/component_kit/cw_button';

type TemplateFormModalProps = {
  isOpen: boolean;
  thread: Thread; // Pass the thread content to the form
  onSave: (link?: Link[]) => void;
  onClose: () => void;
};

export const TemplateActionModal = ({
  isOpen,
  thread,
  onSave,
  onClose,
}: TemplateFormModalProps) => {
  const [tempTemplates, setTempTemplates] = useState<
    Array<Pick<any, 'identifier' | 'title'>>
  >([]);

  const handleTemplateSelect = (template: any) => {
    const isSelected = tempTemplates.find(
      ({ identifier }) => template.identifier === String(identifier)
    );

    console.log('isSelected:', isSelected);

    const updatedTemplates = isSelected
      ? tempTemplates.filter(
          ({ identifier }) => template.identifier !== String(identifier)
        )
      : [
          ...tempTemplates,
          {
            identifier: `${template.contractAddress}/${template.slug}`,
            title: template.title,
          },
        ];

    console.log('updatedTemplates:', updatedTemplates);

    setTempTemplates(updatedTemplates);
  };

  const handleSaveChanges = async () => {
    // Set and save the template links here using the tempTemplates state
    // ...
    let links: Link[] = thread.links;

    try {
      const initialTemplates = []; // Fetch initial templates from the thread

      const { toAdd, toDelete } = getAddedAndDeleted(
        tempTemplates,
        initialTemplates,
        'identifier'
      );

      console.log('toAdd:', toAdd);

      if (toAdd.length > 0) {
        const updatedThread = await app.threads.addLinks({
          threadId: thread.id,
          links: toAdd.map(({ identifier, title }) => ({
            source: LinkSource.Template,
            identifier: identifier,
            title: title,
          })),
        });

        links = updatedThread.links;
      }

      if (toDelete.length > 0) {
        const updatedThread = await app.threads.deleteLinks({
          threadId: thread.id,
          links: toDelete.map(({ identifier }) => ({
            source: LinkSource.Template,
            identifier: String(identifier),
          })),
        });

        links = updatedThread.links;
      }
    } catch (err) {
      console.log(err);
      throw new Error('Failed to update linked templates');
    }

    onSave(links);
  };

  return (
    <div className="TemplateActionModal">
      <div className="compact-modal-title">
        <h3>Add Templates</h3>
        <CWIconButton iconName="close" onClick={() => onClose()} />
      </div>
      <div className="compact-modal-body">
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={onClose}
          onSave={handleSaveChanges}
          thread={thread}
        />
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onClose}
          />
          <CWButton label="Save changes" onClick={onSave} />
        </div>
      </div>
    </div>
  );
};
