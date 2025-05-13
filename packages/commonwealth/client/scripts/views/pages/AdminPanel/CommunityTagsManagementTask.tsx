import axios from 'axios';
import Tag from 'client/scripts/models/Tag';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
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
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from 'views/modals/confirmation_modal';

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
  const [sortColumn, setSortColumn] = useState<
    'name' | 'community_count' | 'created_at'
  >('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { data: tags } = useFetchTagsQuery({
    enabled: true,
    with_community_count: true,
  });
  const { mutateAsync: createTag } = useCreateTagMutation();
  const { mutateAsync: updateTag } = useUpdateTagMutation();
  const { mutateAsync: deleteTag } = useDeleteTagMutation();

  // Filter tags based on search term
  const filteredTags = (tags || []).filter((tag) =>
    tag.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  );

  // Sort tags based on column and direction
  const sortedTags = [...filteredTags].sort((a, b) => {
    if (sortColumn === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? a.community_count! - b.community_count!
        : b.community_count! - a.community_count!;
    }
  });

  // Handler to toggle sort direction or change sort column
  const handleSort = (column: 'name' | 'community_count') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create a new tag
  const handleCreateTag = async () => {
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
  };

  // Update an existing tag
  const handleUpdateTag = async () => {
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
  };

  // Delete a tag with confirmation
  const handleDeleteTag = (tag: Tag) => {
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
  };

  // View communities using a tag
  const handleViewTagUsage = async (tag: Tag) => {
    try {
      const usage = await getTagUsage(tag.id!);
      setTagUsage(usage);
      setShowUsageModal(true);
    } catch (error) {
      console.error('Error fetching tag usage:', error);
      notifyError('Failed to load tag usage information');
    }
  };

  // Table columns configuration
  const columns = [
    {
      id: 'name',
      header: 'Name',
      key: 'name',
      numeric: false,
      sortable: true,
      cell: ({ row }: { row: { original: Tag } }) => {
        const tag = row.original;
        return (
          <div>
            <span>{tag.name}</span>
          </div>
        );
      },
    },
    {
      id: 'community_count',
      header: 'Community Count',
      key: 'community_count',
      numeric: true,
      sortable: true,
      cell: ({ row }: { row: { original: Tag } }) => (
        <div>
          <span>{row.original.community_count}</span>
          {row.original.community_count! > 0 && (
            <CWButton
              label="View"
              buttonHeight="sm"
              buttonType="tertiary"
              onClick={() => handleViewTagUsage(row.original)}
            />
          )}
        </div>
      ),
    },
    {
      id: 'created_at',
      header: 'Created At',
      key: 'created_at',
      numeric: false,
      sortable: true,
      cell: ({ row }: { row: { original: Tag } }) => {
        return <span>{row.original.created_at}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      key: 'actions',
      numeric: false,
      sortable: false,
      cell: ({ row }: { row: { original: Tag } }) => {
        const tag = row.original;
        return (
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
        );
      },
    },
  ];

  return (
    <div className="TaskGroup">
      <CWText type="h4">Community Tags Management</CWText>
      <CWText type="caption">
        Create, edit, and manage tags that can be applied to communities for
        better categorization and discoverability.
      </CWText>

      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <CWTextInput
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tags"
            // iconLeft="search"
          />
          <div>
            <CWText type="caption">{filteredTags.length} tags found</CWText>
          </div>
        </div>

        <CWTable columnInfo={columns} rowData={sortedTags} />
      </div>

      {/* Tag Usage Modal */}
      {showUsageModal && (
        <CWModal
          // title="Communities using this tag"
          open={showUsageModal}
          onClose={() => setShowUsageModal(false)}
          content={
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
    </div>
  );
};

export default CommunityTagsManagementTask;
