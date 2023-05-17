import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'modals/template_action_modal.scss';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { useParams } from 'react-router-dom';
import { Modal } from '../components/component_kit/cw_modal';
import Thread, { Link, LinkSource } from '../../models/Thread';
import { getAddedAndDeleted } from '../../helpers/threads';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type TemplateSelectorItemProps = {
  template: any;
  onClick: () => void;
};

type TemplateSelectorProps = {
  onSelect: (template: any) => void;
  thread: Thread;
  onSave: () => void;
  onClose: () => void;
};

type TemplateFormModalProps = {
  isOpen: boolean;
  thread: Thread; // Pass the thread content to the form
  onSave: (link?: Link[]) => void;
  onClose: () => void;
};

export const TemplateSelectorItem = ({
  template,
  onClick,
}: TemplateSelectorItemProps) => {
  return (
    <div className="TemplateSelectorItem" onClick={onClick}>
      <div className="template-nickname">{template.name}</div>
      <div className="template-contract-address">
        Created By: {template.created_by}
      </div>
    </div>
  );
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
      </div>
    </div>
  );
};

export const TemplateSelector = ({
  onSelect,
  onClose,
  onSave,
}: TemplateSelectorProps) => {
  const [allTemplates, setAllTemplates] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getTemplatesForAllContracts = async () => {
    const contractsInStore = app.contracts.getCommunityContracts();
    for (const contract of contractsInStore) {
      const templates = await app.contracts.getTemplatesForContract(
        contract.id
      );
      allTemplates.push(...templates);
    }

    return allTemplates;
  };

  const fetchTemplates = async () => {
    await getTemplatesForAllContracts().then((templates) => {
      setAllTemplates(templates);
      console.log('All templates:', allTemplates);
      setLoading(false); // Set loading state to false after templates are fetched
    });
  };

  useEffect(() => {
    if (allTemplates.length === 0) setLoading(true); // Set loading state to true before fetching templates
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTemplates]);

  const templates = useMemo(() => {
    if (!searchTerm.length) return allTemplates;
    else {
      allTemplates
        .sort((a, b) => b.created_at - a.created_at)
        .filter(({ nickname }) =>
          nickname.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
  }, [allTemplates, searchTerm]);

  const renderItem = useCallback(
    (i: number, template: any) => {
      return (
        <TemplateSelectorItem
          template={template}
          onClick={() => onSelect(template)}
        />
      );
    },
    [onSelect]
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const EmptyComponent = () => (
    <div className="empty-component">No templates found</div>
  );

  return (
    <div className="TemplateSelector">
      <CWTextInput
        placeholder="Search for templates"
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />
      <QueryList
        loading={loading}
        options={templates}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
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
  );
};
