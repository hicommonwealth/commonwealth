import React from 'react';
import HomePage from 'views/pages/HomePage/HomePage';

export type UserDashboardProps = {
  type?: string;
};

const UserDashboard = (_props: UserDashboardProps) => {
  return <HomePage />;
};

export default UserDashboard;
