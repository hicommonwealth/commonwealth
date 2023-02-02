import { useParams, useNavigate, useLocation } from 'react-router-dom';

// This helper should be used as a wrapper to Class Components
// to access react-router functionalities
export const withRouter = (Component) => {
  return (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    return <Component {...props} router={{ location, navigate, params }} />;
  };
};
