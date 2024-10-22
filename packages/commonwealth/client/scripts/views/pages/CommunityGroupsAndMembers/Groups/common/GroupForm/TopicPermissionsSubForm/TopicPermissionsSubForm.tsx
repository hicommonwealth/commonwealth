import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { TOPIC_PERMISSIONS } from '../constants';
import { TopicPermissionsSubFormType } from '../index.types';
import './TopicPermissionsSubForm.scss';

const permissionMap = Object.values(TOPIC_PERMISSIONS).map((permission) => ({
  label: permission,
  value: permission,
}));

const TopicPermissionsSubForm = ({
  topic,
  defaultPermission,
  onPermissionChange,
}: TopicPermissionsSubFormType) => {
  return (
    <div className="TopicPermissionsSubForm">
      <CWText>{topic.name}</CWText>

      <CWSelectList
        placeholder="Select topic permissions"
        isSearchable={false}
        defaultValue={permissionMap.find((p) => p.value === defaultPermission)}
        options={permissionMap}
        onChange={(option) => option?.value && onPermissionChange(option.value)}
      />
    </div>
  );
};

export default TopicPermissionsSubForm;
