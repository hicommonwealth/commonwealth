import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'modals/template_action_modal.scss';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { useParams } from 'react-router-dom';
import { Modal } from '../components/component_kit/cw_modal';

type TemplateSelectorItemProps = {
  template: any;
  onClick: () => void;
};

type TemplateSelectorProps = {
  onSelect: (template: any) => void;
};

type TemplateFormModalProps = {
  isOpen: boolean;
  threadContent: string; // Pass the thread content to the form
  onSave: () => void;
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
  threadContent,
  onSave,
  onClose,
}: TemplateFormModalProps) => {
  const handleTemplateSelect = (template: any) => {
    console.log('Selected template:', template);
    onSave();
  };

  return (
    <Modal
      content={<TemplateSelector onSelect={handleTemplateSelect} />}
      onClose={onClose}
      open={isOpen}
    />
  );
};

export const TemplateSelector = ({ onSelect }: TemplateSelectorProps) => {
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
    </div>
  );
};
