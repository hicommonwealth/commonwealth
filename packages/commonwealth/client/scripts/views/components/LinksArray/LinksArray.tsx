import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import LinkItem from './LinkItem/LinkItem';
import './LinksArray.scss';
import { LinksArrayProps } from './types';

const LinksArray = ({
  label,
  placeholder = 'https://example.com',
  addLinkButtonCTA = '+ Add link',
  canAddLinks = true,
  canDeleteLinks = true,
  canConfigureLinks = false,
  links = [],
  onLinkAdd,
  onLinkRemovedAtIndex,
  onLinkUpdatedAtIndex,
  onLinkConfiguredAtIndex = () => {},
}: LinksArrayProps) => {
  return (
    <section className="LinksArray">
      {label && <CWText type="caption">{label}</CWText>}

      {links.map((link, index) => (
        <LinkItem
          key={index}
          error={link.error}
          value={link.value}
          placeholder={placeholder}
          canUpdate={link.canUpdate}
          canDelete={link.canDelete}
          customElementAfterLink={link.customElementAfterLink}
          onDelete={() => onLinkRemovedAtIndex(index)}
          showDeleteButton={canDeleteLinks}
          canConfigure={link.canConfigure}
          onConfgure={() => onLinkConfiguredAtIndex?.(index)}
          showConfigureButton={canConfigureLinks}
          onUpdate={(updatedValue) =>
            onLinkUpdatedAtIndex(
              {
                ...link,
                value: updatedValue,
              },
              index,
            )
          }
        />
      ))}

      {canAddLinks && (
        <button type="button" className="add-link-button" onClick={onLinkAdd}>
          {addLinkButtonCTA}
        </button>
      )}
    </section>
  );
};

export default LinksArray;
