import { VALIDATION_MESSAGES } from 'helpers/formValidationMessages';
import { useState } from 'react';
import { ZodError } from 'zod';
import { Link, LinksArrayHookProps } from './types';

const useLinksArray = ({
  initialLinks = [],
  linkValidation,
}: LinksArrayHookProps) => {
  const [links, setLinks] = useState<Link[]>(initialLinks);

  const onLinkAdd = () => {
    setLinks((link) => [
      ...(link || []),
      {
        value: '',
        error: '',
        canDelete: true,
        canUpdate: true,
        canConfigure: false,
      },
    ]);
  };

  const onLinkRemovedAtIndex = (index: number) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    setLinks([...updatedLinks]);
  };

  const getLinkValidationError = (link: string): string => {
    if (!linkValidation) return '';

    try {
      linkValidation.parse(link);
      return '';
    } catch (e: any) {
      const zodError = e as ZodError;
      return zodError.errors[0].message || VALIDATION_MESSAGES.INVALID_INPUT;
    }
  };

  const onLinkUpdatedAtIndex = (updatedLink: Link, index: number) => {
    const updatedLinks = [...links];
    updatedLinks[index] = {
      ...updatedLink,
      value: updatedLink.value.trim(),
      error: getLinkValidationError(updatedLink.value.trim()),
    };

    setLinks([...updatedLinks]);
  };

  const areLinksValid = (): boolean => {
    if (!linkValidation) return true;

    const updatedLinks = [...links];
    for (let index = 0; index < updatedLinks.length; index++) {
      if (getLinkValidationError(updatedLinks[index].value)) return false;
    }

    return true;
  };

  return {
    links,
    setLinks,
    areLinksValid,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    getLinkValidationError,
  };
};

export default useLinksArray;
