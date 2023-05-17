import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CWTextInput } from '../component_kit/cw_text_input';
import { QueryList } from '../component_kit/cw_query_list';
import { TemplateSelectorItem } from './template_action_selector_item';
import Thread from 'models/Thread';
import app from 'state';

type TemplateSelectorProps = {
  onSelect: (template: any) => void;
  thread: Thread;
  onSave: () => void;
  onClose: () => void;
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
      const isSelected = !!tempTemplates.find(
        ({ identifier }) => template.identifier === String(identifier)
      );

      return (
        <TemplateSelectorItem
          template={template}
          onClick={() => onSelect(template)}
          isSelected={isSelected}
        />
      );
    },
    [onSelect, tempTemplates]
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
