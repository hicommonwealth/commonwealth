import axios from 'axios';
import Tag from 'client/scripts/models/Tag';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { APIOrderDirection } from 'helpers/constants';
import React, { useState } from 'react';
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useFetchTagsQuery,
  useUpdateTagMutation,
} from 'state/api/tags';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import {
  CWTable,
  CWTableColumnInfo,
} from 'views/components/component_kit/new_designs/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from 'views/modals/confirmation_modal';

const columns: CWTableColumnInfo[] = [
  {
    key: 'name',
    header: 'Name',
    numeric: false,
    sortable: true,
  },
  {
    key: 'community_count',
    header: 'Community Count',
    numeric: true,
    sortable: true,
  },
  {
    key: 'created_at',
    header: 'Created At',
    numeric: false,
    sortable: true,
  },
  {
    key: 'actions',
    header: 'Actions',
    numeric: false,
    sortable: false,
  },
];

const getTagUsage = async (
  id: number,
): Promise<{ communities: { id: string; name: string }[] }> => {
  const response = await axios.get(`/api/v1/admin/tags/${id}/usage`);
  return response.data;
};

const CommunityTagsManagementTask = () => {
  const [newTagName, setNewTagName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [tagUsage, setTagUsage] = useState<{
    communities: { id: string; name: string }[];
  }>({ communities: [] });
  const { data: tags } = useFetchTagsQuery({
    enabled: true,
    with_community_count: true,
  });
  const { mutateAsync: createTag } = useCreateTagMutation();
  const { mutateAsync: updateTag } = useUpdateTagMutation();
  const { mutateAsync: deleteTag } = useDeleteTagMutation();

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'name',
    initialSortDirection: APIOrderDirection.Asc,
  });

  // Filter tags based on search term
  const filteredTags = (tags || []).filter((tag) =>
    tag.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  );

  // Prepare rowData with custom cell content
  const rowData = filteredTags.map((tag) => ({
    ...tag,
    name: {
      sortValue: tag.name,
      customElement: <span>{tag.name}</span>,
    },
    community_count: {
      sortValue: tag.community_count,
      customElement: (
        <div>
          <span>{tag.community_count}</span>
          {tag.community_count > 0 && (
            <CWButton
              label="View"
              buttonHeight="sm"
              buttonType="tertiary"
              onClick={() => handleViewTagUsage(tag)}
            />
          )}
        </div>
      ),
    },
    created_at: {
      sortValue: tag.created_at,
      customElement: <span>{tag.created_at}</span>,
    },
    actions: {
      customElement: (
        <div className="actions-column">
          <CWButton
            label="Edit"
            buttonHeight="sm"
            buttonType="secondary"
            onClick={() => setEditingTag(tag)}
          />
          <CWButton
            label="Delete"
            buttonHeight="sm"
            buttonType="tertiary"
            onClick={() => handleDeleteTag(tag)}
          />
        </div>
      ),
    },
  }));

  async function handleCreateTag() {
    if (!newTagName.trim()) {
      notifyError('Tag name cannot be empty');
      return;
    }
    try {
      await createTag({ name: newTagName.trim() });
      setNewTagName('');
      notifySuccess('Tag created successfully');
    } catch (error) {
      console.error('Error creating tag:', error);
      notifyError('Failed to create tag');
    }
  }

  async function handleUpdateTag() {
    if (!editingTag || !editingTag.name.trim()) {
      notifyError('Tag name cannot be empty');
      return;
    }
    try {
      await updateTag({ id: editingTag.id, name: editingTag.name.trim() });
      setEditingTag(null);
      notifySuccess('Tag updated successfully');
    } catch (error) {
      console.error('Error updating tag:', error);
      notifyError('Failed to update tag');
    }
  }

  function handleDeleteTag(tag: Tag) {
    openConfirmation({
      title: 'Delete Tag',
      description: `Are you sure you want to delete the tag "${tag.name}"? ${
        tag.community_count! > 0
          ? `This tag is currently used by ${tag.community_count} communities.`
          : ''
      }`,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await deleteTag({ id: tag.id });
              notifySuccess('Tag deleted successfully');
            } catch (error) {
              console.error('Error deleting tag:', error);
              notifyError('Failed to delete tag');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  }

  async function handleViewTagUsage(tag: Tag) {
    try {
      const usage = await getTagUsage(tag.id!);
      setTagUsage(usage);
      setShowUsageModal(true);
    } catch (error) {
      console.error('Error fetching tag usage:', error);
      notifyError('Failed to load tag usage information');
    }
  }

  return (
    <>
      <div className="TaskGroup CommunityTagsManagementTask">
        <CWText type="h4">Community Tags Management</CWText>
        <CWText type="caption">
          Create, edit, and manage tags that can be applied to communities for
          better categorization and discoverability.
        </CWText>

        <div className="top-row">
          <CWTextInput
            value={newTagName}
            onInput={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
          />
          <CWButton
            label="Create Tag"
            onClick={handleCreateTag}
            disabled={!newTagName.trim()}
          />
        </div>

        <div className="search-row">
          <CWTextInput
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tags"
          />
          <div>
            <CWText type="caption">{filteredTags.length} tags found</CWText>
          </div>
        </div>

        <CWTable
          columnInfo={tableState.columns}
          sortingState={tableState.sorting}
          setSortingState={tableState.setSorting}
          rowData={rowData}
        />
      </div>

      {/* Tag Usage Modal */}
      {showUsageModal && (
        <CWModal
          open={showUsageModal}
          onClose={() => setShowUsageModal(false)}
          content={
            <div className="modal-content">
              {tagUsage.communities.length === 0 ? (
                <CWText>No communities are using this tag.</CWText>
              ) : (
                <ul>
                  {tagUsage.communities.map((community) => (
                    <li key={community.id}>
                      <a
                        href={`/${community.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {community.name} ({community.id})
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
        />
      )}
    </>
  );
};

export default CommunityTagsManagementTask;
