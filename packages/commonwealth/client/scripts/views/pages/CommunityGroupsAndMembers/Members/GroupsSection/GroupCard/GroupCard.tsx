import React from 'react';
import { Link } from 'react-router-dom';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { formatAddressShort } from '../../../../../../helpers/index';
import useBrowserWindow from '../../../../../../hooks/useBrowserWindow';
import MinimumProfile from '../../../../../../models/MinimumProfile';
import { Avatar } from '../../../../../components/Avatar/index';
import './GroupCard.scss';
import RequirementCard from './RequirementCard/RequirementCard';

type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
  requirementTokenId?: string;
};

type GroupCardProps = {
  isJoined?: boolean;
  groupName: string;
  groupDescription?: string;
  requirements?: RequirementCardProps[]; // This represents erc requirements
  requirementsToFulfill: 'ALL' | number;
  allowLists?: string[];
  topics: { id: number; name: string }[];
  canEdit?: boolean;
  onEditClick?: () => any;
  profiles?: Map<string, MinimumProfile>;
};

const GroupCard = ({
  isJoined,
  groupName,
  groupDescription,
  requirements,
  requirementsToFulfill,
  allowLists,
  topics,
  canEdit,
  onEditClick = () => {},
  profiles,
}: GroupCardProps) => {
  const { isWindowSmallInclusive } = useBrowserWindow({});

  return (
    <section className="GroupCard">
      {/* Join status */}
      <CWTag
        type={isJoined ? 'passed' : 'referendum'}
        label={isJoined ? 'In group' : 'Not in group'}
      />

      {/* Name and description */}
      <div className="group-name-row">
        <CWText type="h3" className="group-name-text">
          {groupName}
        </CWText>
        {canEdit && (
          <button className="group-edit-button" onClick={onEditClick}>
            <CWIcon iconName="notePencil" iconSize="medium" />
            <CWText type="caption">Edit</CWText>
          </button>
        )}
      </div>
      {groupDescription && <CWText type="b2">{groupDescription}</CWText>}

      <CWDivider />

      {/* Sub requirements */}
      <CWText type="h5">Requirements</CWText>
      <CWText type="b2">
        {requirementsToFulfill === 'ALL'
          ? 'All requirements must be satisfied'
          : `At least ${requirementsToFulfill} # of all requirements`}
      </CWText>
      {requirements.map((r, index) => (
        <RequirementCard key={index} {...r} />
      ))}

      {allowLists && (
        <>
          <CWText type="h5">Allow List</CWText>
          <CWText type="b2">
            These users are added directly to the group and may bypass
            additional requirements
          </CWText>
          <div className="allowlist-table">
            <table>
              <thead>
                <tr className="column-header">
                  <th>
                    <CWText type="b2">Username</CWText>
                  </th>
                  <th>
                    <CWText type="b2">Address</CWText>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allowLists.map((address, index) => (
                  <tr key={index}>
                    <div className="table-spacing">
                      <Link
                        to={`/profile/id/${profiles.get(address)?.id}`}
                        className="user-info"
                      >
                        <Avatar
                          url={profiles.get(address)?.avatarUrl}
                          size={24}
                          address={profiles.get(address)?.id}
                        />
                        <CWText type="b2">
                          {profiles.get(address)?.name ?? 'undefined'}
                        </CWText>
                      </Link>
                    </div>
                    <td>
                      <CWText type="b2">
                        {(!isWindowSmallInclusive
                          ? profiles.get(address)?.address
                          : formatAddressShort(address, 5, 6)) ?? 'error'}
                      </CWText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Gated topics */}
      {topics.length > 0 && (
        <>
          <CWText type="h5">Gated Topics</CWText>
          <div className="gating-tags">
            {topics.map((t, index) => (
              <CWTag key={index} label={t.name} type="referendum" />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default GroupCard;
