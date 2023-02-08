import React from 'react';
import {
  useParams,
  useNavigate,
  useLocation,
  Navigate as ReactNavigate,
} from 'react-router-dom';

// This helper should be used as a wrapper to Class Components
// to access react-router functionalities
const withRouter = (Component) => {
  return (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    return <Component {...props} router={{ location, navigate, params }} />;
  };
};

type NavigateWithParamsProps = {
  to: string | ((params: Record<string, string | undefined>) => string);
};

export const Navigate = ({ to }: NavigateWithParamsProps) => {
  const params = useParams();
  const navigateTo = typeof to === 'string' ? to : to(params);

  return <ReactNavigate to={navigateTo} />;
};

export default withRouter;
