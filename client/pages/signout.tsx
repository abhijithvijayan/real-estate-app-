import React, {FC, useEffect} from 'react';
import Router from 'next/router';

import {useStoreActions} from '../state/store';

const LogoutPage: FC = () => {
  const logout = useStoreActions((s) => s.auth.logout);

  useEffect(() => {
    logout();
    Router.push('/signin');
  }, [logout]);

  return <div />;
};

export default LogoutPage;