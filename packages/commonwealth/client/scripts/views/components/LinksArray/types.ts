import { ReactNode } from 'react';
import z from 'zod';

export type Link = {
  value: string;
  error?: string;
  canUpdate?: boolean;
  canDelete?: boolean;
  canConfigure?: boolean;
  customElementAfterLink?: ReactNode;
  metadata?: any;
};

export type LinkItemProps = {
  placeholder?: string;
  canDelete?: boolean;
  onDelete?: () => any;
  showDeleteButton?: boolean;
  canConfigure?: boolean;
  onConfgure?: () => any;
  showConfigureButton?: boolean;
  error?: string;
  value?: string;
  canUpdate?: boolean;
  onUpdate?: (value: string) => any;
  customElementAfterLink?: ReactNode;
};

export type LinksArrayProps = {
  label?: string;
  placeholder?: string;
  addLinkButtonCTA?: string;
  canAddLinks?: boolean;
  canDeleteLinks?: boolean;
  canConfigureLinks?: boolean;
  links: Link[];
  onLinkAdd: () => any;
  onLinkRemovedAtIndex: (index: number) => any;
  onLinkUpdatedAtIndex: (updatedLink: Link, index: number) => any;
  onLinkConfiguredAtIndex?: (index) => any;
};

export type LinksArrayHookProps = {
  initialLinks: Link[];
  linkValidation?: z.ZodTypeAny;
};
