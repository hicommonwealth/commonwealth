import { GatedActionEnum, UserFriendlyActionMap } from '@hicommonwealth/shared';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWToggle } from 'client/scripts/views/components/component_kit/cw_toggle';
import React from 'react';
import {
  Topic,
  TopicPermissionFormToggleGroupSubFormProps,
} from '../index.types';
import './TopicPermissionToggleGroupSubForm.scss';

const TopicPermissionToggleGroupSubForm = ({
  PermissionFormData,
  onChange,
}: TopicPermissionFormToggleGroupSubFormProps) => {
  const topics = PermissionFormData.map((item) => item.topic);

  const toggle = (selectedTopics: Topic[], gatedAction: GatedActionEnum) => {
    const value = selectedTopics.every((topic) =>
      PermissionFormData.find(
        (item) => item.topic === topic,
      )?.permission.includes(gatedAction),
    );
    return !value;
  };

  const handlePermissionChange = (
    gatedAction: GatedActionEnum,
    topic?: Topic,
  ) => {
    if (topic) {
      const data = PermissionFormData.find((p) => p.topic.id === topic.id);
      if (data) {
        const enable = !data.permission.some((p) => p === gatedAction);
        data.permission = enable
          ? [...new Set([...data.permission, gatedAction])]
          : data.permission.filter((perm) => perm !== gatedAction);
      }
    } else {
      const enable = toggle(topics, gatedAction);
      PermissionFormData.forEach((item) => {
        item.permission = enable
          ? [...new Set([...item.permission, gatedAction])]
          : item.permission.filter((perm) => perm !== gatedAction);
      });
    }
    onChange(PermissionFormData.map((item) => ({ ...item })));
  };

  return (
    <div className="TopicPermissions">
      <div className="permissions-header">
        <CWText className="header-title" fontWeight="regular">
          Topic
        </CWText>
        <div className="header-permissions">
          {Object.values(UserFriendlyActionMap).map((perm, index) => (
            <CWText key={index} className="header-item" fontWeight="regular">
              {perm}
            </CWText>
          ))}
        </div>
      </div>

      {topics.map((topic, topicIndex) => (
        <div className="permissions-row" key={topicIndex}>
          <CWText className="topic-name" fontWeight="regular">
            {topic?.name}
          </CWText>
          {(Object.keys(UserFriendlyActionMap) as GatedActionEnum[]).map(
            (gatedAction, permIndex) => (
              <div className="toggle" key={permIndex}>
                <CWToggle
                  checked={PermissionFormData.find(
                    (item) => item.topic === topic,
                  )?.permission.includes(gatedAction)}
                  onChange={() => handlePermissionChange(gatedAction, topic)}
                />
              </div>
            ),
          )}
        </div>
      ))}

      <div className="permissions-row all-row">
        <div className="topic-name">All</div>
        {(Object.keys(UserFriendlyActionMap) as GatedActionEnum[]).map(
          (gatedAction, permIndex) => (
            <div className="toggle" key={permIndex}>
              <CWToggle
                checked={topics.every((topic) =>
                  PermissionFormData.find(
                    (item) => item.topic === topic,
                  )?.permission.includes(gatedAction),
                )}
                onChange={() => handlePermissionChange(gatedAction)}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default TopicPermissionToggleGroupSubForm;
