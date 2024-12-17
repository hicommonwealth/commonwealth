import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { isValidSlug } from '../utils/url-validation';

/**
 * Higher-order component that validates route parameters to prevent security vulnerabilities
 * Redirects to dashboard if any route parameter contains malicious content
 * @param WrappedComponent The component to wrap with route validation
 */
export const withRouteValidation = (
  WrappedComponent: React.ComponentType<any>,
): React.FC<any> => {
  return (props: any) => {
    const params = useParams();

    // Check all route parameters for malicious content
    const invalidParam = Object.values(params).find(
      (param) => param && !isValidSlug(param),
    );

    // Redirect to dashboard if malicious content detected
    if (invalidParam) {
      return <Navigate to="/dashboard" replace />;
    }

    // Render original component if all parameters are valid
    return <WrappedComponent {...props} />;
  };
};
