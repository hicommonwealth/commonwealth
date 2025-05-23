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

  const handlePermissionChange = (
    topic: Topic,
    gatedAction: GatedActionEnum,
  ) => {
    const updatedData = PermissionFormData.map((item) => {
      if (item.topic === topic) {
        const updatedPermissions = item.permission.filter(
          (perm) => perm !== gatedAction,
        );

        if (!item.permission.some((perm) => perm === gatedAction)) {
          updatedPermissions.push(gatedAction);
        }

        return { ...item, permission: updatedPermissions };
      }
      return item;
    });

    onChange(updatedData);
  };

  const handlePrivateChange = () => {
    onChange(PermissionFormData.map((item) => ({ ...item })));
  };

  const toggleAllPermissionsForAction = (
    gatedAction: GatedActionEnum,
    toggleValue: boolean,
  ) => {
    const updatedData = PermissionFormData.map((item) => {
      const updatedPermissions = toggleValue
        ? [...new Set([...item.permission, gatedAction])]
        : item.permission.filter((perm) => perm !== gatedAction);
      return { ...item, permission: updatedPermissions };
    });

    onChange(updatedData);
  };

  const toggle = (selectedTopics: Topic[], gatedAction: GatedActionEnum) => {
    const value = selectedTopics.every((topic) =>
      PermissionFormData.find(
        (item) => item.topic === topic,
      )?.permission.includes(gatedAction),
    );
    return !value;
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
          <CWText key="is_private" className="header-item" fontWeight="bold">
            Private
          </CWText>
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
                  onChange={() => handlePermissionChange(topic, gatedAction)}
                />
              </div>
            ),
          )}
          <div className="toggle" key="is_private">
            <CWToggle
              checked={topic.is_private}
              onChange={() => {
                topic.is_private = !topic.is_private;
                handlePrivateChange();
              }}
            />
          </div>
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
                onChange={() =>
                  toggleAllPermissionsForAction(
                    gatedAction,
                    toggle(topics, gatedAction),
                  )
                }
              />
            </div>
          ),
        )}
        <div className="toggle" key="is_private">
          <CWToggle
            checked={topics.every((topic) => topic.is_private)}
            onChange={() => {
              const value = !topics.every((topic) => topic.is_private);
              topics.forEach((topic) => (topic.is_private = value));
              handlePrivateChange();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TopicPermissionToggleGroupSubForm;
