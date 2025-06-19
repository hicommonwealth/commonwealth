import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useGetTagUsage } from 'state/api/tags';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWResponsiveDialog } from 'views/components/component_kit/new_designs/CWResponsiveDialog';

import './TagUsageDialog.scss';

interface TagUsageDialogProps {
  tagId: number | null;
  tagName: string;
  isOpen: boolean;
  onClose: () => void;
}

const TagUsageDialog = ({
  tagId,
  tagName,
  isOpen,
  onClose,
}: TagUsageDialogProps) => {
  const { data, isLoading, error } = useGetTagUsage(tagId || undefined);
  const navigate = useCommonNavigate();

  const handleCommunityClick = (communityId: string) => {
    // Close the dialog and navigate
    onClose();
    navigate(`/${communityId}`, {}, null);
  };

  return (
    <CWResponsiveDialog
      open={isOpen}
      onClose={onClose}
      className="TagUsageDialog"
    >
      <div className="tag-usage-container">
        <CWText type="h3" className="dialog-title">
          Communities using &quot;{tagName}&quot; tag
        </CWText>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner">Loading...</div>
          </div>
        )}

        {error && (
          <div className="error-container">
            <CWText type="b1">Error loading communities</CWText>
          </div>
        )}

        {!isLoading && !error && data?.communities.length === 0 && (
          <CWText>No communities are using this tag.</CWText>
        )}

        {!isLoading && !error && (data?.communities.length || 0) > 0 && (
          <div className="communities-list">
            <div className="list-header">
              <CWText type="caption" fontWeight="medium">
                Community Name
              </CWText>
              <CWText type="caption" fontWeight="medium">
                Community ID
              </CWText>
            </div>
            {data?.communities?.map((community) => (
              <div key={community.id} className="community-item">
                <CWText>
                  <span
                    className="community-link"
                    onClick={() => handleCommunityClick(community.id)}
                  >
                    {community.name}
                  </span>
                </CWText>
                <CWText className="community-id">{community.id}</CWText>
              </div>
            ))}
          </div>
        )}
      </div>
    </CWResponsiveDialog>
  );
};

export default TagUsageDialog;
