import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from 'views/components/Avatar';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { formatAddressShort } from '../../../../../../helpers';
import CWPagination from '../../../../../components/component_kit/new_designs/CWPagination/CWPagination';
import { convertGranularPermissionsToAccumulatedPermissions } from '../../../Groups/common/GroupForm/helpers';
import './GroupCard.scss';
import RequirementCard from './RequirementCard/RequirementCard';
import { GroupCardProps } from './types';

const ALLOWLIST_MEMBERS_PER_PAGE = 7;

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
  const [currentAllowlistPage, setCurrentAllowlistPage] = useState(1);

  const paginatedAllowlist = allowLists?.slice(
    ALLOWLIST_MEMBERS_PER_PAGE * (currentAllowlistPage - 1),
    ALLOWLIST_MEMBERS_PER_PAGE * currentAllowlistPage,
  );
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
      {/* @ts-expect-error StrictNullChecks*/}
      {requirements.map((r, index) => (
        <RequirementCard key={index} {...r} />
      ))}

      {paginatedAllowlist && (
        <>
          <CWText type="h5">Allow List</CWText>
          <CWText type="b2">
            These users are added directly to the group and may bypass
            additional requirements
          </CWText>
          <div className="allowlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <CWText type="b2">Username</CWText>
                  </th>
                  <th>
                    <CWText type="b2">Address</CWText>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAllowlist.map((address, index) => (
                  <tr key={index}>
                    <div className="table-spacing">
                      <Link
                        // @ts-expect-error <StrictNullChecks/>
                        to={`/profile/id/${profiles.get(address)?.userId}`}
                        className="user-info"
                      >
                        <Avatar
                          // @ts-expect-error <StrictNullChecks/>
                          url={profiles.get(address)?.avatarUrl}
                          size={24}
                          // @ts-expect-error <StrictNullChecks/>
                          address={profiles.get(address)?.userId}
                        />
                        <CWText type="b2">
                          {/* @ts-expect-error StrictNullChecks*/}
                          {profiles.get(address)?.name ?? 'undefined'}
                        </CWText>
                      </Link>
                    </div>
                    <td>
                      <CWText type="b2">
                        {(!isWindowSmallInclusive
                          ? // @ts-expect-error <StrictNullChecks/>
                            profiles.get(address)?.address
                          : formatAddressShort(address, 5, 6)) ?? 'error'}
                      </CWText>
                    </td>
                  </tr>
                ))}
              </tbody>
              <div className="pagination-buttons">
                {/* @ts-expect-error StrictNullChecks*/}
                {allowLists.length > ALLOWLIST_MEMBERS_PER_PAGE && (
                  <CWPagination
                    totalCount={Math.ceil(
                      // @ts-expect-error <StrictNullChecks/>
                      allowLists.length / ALLOWLIST_MEMBERS_PER_PAGE,
                    )}
                    onChange={(_, n) => setCurrentAllowlistPage(n)}
                  />
                )}
              </div>
            </table>
          </div>
        </>
      )}

      {/* Gated topics */}
      {topics.length > 0 && (
        <>
          <CWText type="h5">Gated Topics</CWText>
          <div className="gating-topics">
            <div className="row">
              <CWText type="b2">Topic</CWText>
              <CWText type="b2">Permission</CWText>
            </div>
            {topics.map((t, index) => (
              <div key={index}>
                <CWDivider className="divider-spacing" />
                <div className="row">
                  <CWText type="b2">{t.name}</CWText>

                  <CWTag
                    label={convertGranularPermissionsToAccumulatedPermissions(
                      t.permissions || [],
                    )}
                    type="referendum"
                  />
                </div>
                <CWDivider className="divider-spacing" />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default GroupCard;
