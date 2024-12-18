import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { isValidSlug } from '../utils/url-validation';

export interface WithRouteValidationProps {
  [key: string]: unknown;
}

export const withRouteValidation = <P extends WithRouteValidationProps>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<P> => {
  const ValidationWrapper: React.FC<P> = (props) => {
    const params = useParams();

    const invalidParam = Object.values(params).find(
      (param) => param && !isValidSlug(param),
    );

    if (invalidParam) {
      return <Navigate to="/dashboard" replace />;
    }

    return <WrappedComponent {...props} />;
  };

  ValidationWrapper.displayName = `WithRouteValidation(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ValidationWrapper;
};
