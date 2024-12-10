import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWToggle } from 'client/scripts/views/components/component_kit/cw_toggle';
import React from 'react';
import { PermissionLabel, togglePermissionMap } from '../constants';
import {
  PermissionLabelType,
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
    permissionLabel: PermissionLabelType,
  ) => {
    const permissionsToToggle = togglePermissionMap[permissionLabel] || [];

    const updatedData = PermissionFormData.map((item) => {
      if (item.topic === topic) {
        const updatedPermissions = item.permission.filter(
          (perm) => !permissionsToToggle.includes(perm),
        );

        if (
          !item.permission.some((perm) => permissionsToToggle.includes(perm))
        ) {
          updatedPermissions.push(...permissionsToToggle);
        }

        return { ...item, permission: updatedPermissions };
      }
      return item;
    });

    onChange(updatedData);
  };

  const togglePermission = (
    topic: Topic,
    permissionLabel: PermissionLabelType,
  ) => {
    handlePermissionChange(topic, permissionLabel);
  };

  const toggleAllPermissionsForAction = (
    permissionLabel: PermissionLabelType,
    toggleValue: boolean,
  ) => {
    const permissionsToToggle = togglePermissionMap[permissionLabel] || [];

    const updatedData = PermissionFormData.map((item) => {
      const updatedPermissions = toggleValue
        ? [...new Set([...item.permission, ...permissionsToToggle])]
        : item.permission.filter((perm) => !permissionsToToggle.includes(perm));

      return { ...item, permission: updatedPermissions };
    });

    onChange(updatedData);
  };

  const toggle = (
    selectedTopics: Topic[],
    permissionLabel: PermissionLabelType,
  ) => {
    const permissionsToCheck = togglePermissionMap[permissionLabel] || [];
    const value = selectedTopics.every((topic) =>
      permissionsToCheck.every((perm) =>
        PermissionFormData.find(
          (item) => item.topic === topic,
        )?.permission.includes(perm),
      ),
    );
    return !value;
  };

  return (
    <div className="topic-permissions">
      <div className="permissions-header">
        <CWText className="header-title" fontWeight="regular">
          Topic
        </CWText>
        <div className="header-permissions">
          {PermissionLabel.map((perm, index) => (
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
          {PermissionLabel.map((permission, permIndex) => (
            <div className="toggle" key={permIndex}>
              <CWToggle
                checked={togglePermissionMap[permission]?.every((perm) =>
                  PermissionFormData.find(
                    (item) => item.topic === topic,
                  )?.permission.includes(perm),
                )}
                onChange={() => togglePermission(topic, permission)}
              />
            </div>
          ))}
        </div>
      ))}

      <div className="permissions-row all-row">
        <div className="topic-name">All</div>
        {PermissionLabel.map((permission, permIndex) => (
          <div className="toggle" key={permIndex}>
            <CWToggle
              checked={topics.every((topic) =>
                togglePermissionMap[permission]?.every((perm) =>
                  PermissionFormData.find(
                    (item) => item.topic === topic,
                  )?.permission.includes(perm),
                ),
              )}
              onChange={() =>
                toggleAllPermissionsForAction(
                  permission,
                  toggle(topics, permission),
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicPermissionToggleGroupSubForm;
