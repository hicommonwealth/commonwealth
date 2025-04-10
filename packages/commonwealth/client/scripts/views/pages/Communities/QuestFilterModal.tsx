import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import { QuestOption } from '../Leaderboard/XPTable/XPTable';
import './QuestFilterModal.scss';

interface QuestFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuest: QuestOption | null;
  onQuestChange: (quest: QuestOption | null) => void;
}

const QuestFilterModal: React.FC<QuestFilterModalProps> = ({
  isOpen,
  onClose,
  selectedQuest,
  onQuestChange,
}) => {
  const xpEnabled = useFlag('xp');

  const { data: questsList } = useFetchQuestsQuery({
    limit: 50,
    include_system_quests: true,
    cursor: 1,
    enabled: xpEnabled,
  });

  const quests = (questsList?.pages || []).flatMap((page) => page.results);
  const questOptions = quests.map((quest) => ({
    value: quest.id.toString(),
    label: quest.name,
  }));

  return (
    <CWModal
      size="small"
      content={
        <div className="quest-filter-modal">
          <CWText type="h3">Filter Users by Quest</CWText>
          <div className="modal-content">
            <CWText type="b1" className="description">
              Select a quest to filter the user list to only show users who have
              participated in the chosen quest.
            </CWText>
            <div className="quest-select">
              <CWSelectList
                placeholder="Select a quest"
                value={selectedQuest}
                onChange={(option) => onQuestChange(option as QuestOption)}
                options={questOptions}
                isClearable
                isSearchable
              />
            </div>
          </div>
        </div>
      }
      onClose={onClose}
      open={isOpen}
    />
  );
};

export default QuestFilterModal;
