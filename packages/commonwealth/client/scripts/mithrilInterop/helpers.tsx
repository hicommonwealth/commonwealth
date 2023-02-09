import React from 'react';
import { useNavigate } from 'react-router';

export function NavigationWrapper(Component) {
  return (props) => {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}
