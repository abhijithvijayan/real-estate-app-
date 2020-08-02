import {NextPage, NextPageContext} from 'next';
import React, {useEffect} from 'react';
import Router from 'next/router';
import 'twin.macro';

import BodyWrapper from '../../components/BodyWrapper';
import DashboardPage from '../../components/Dashboard';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

import {SidebarContextProvider} from '../../contexts/sidebar-context';
import useGetRequest from '../../api/useGetRequest';
import {useStoreState} from '../../state/store';
import {getToken} from '../../util/token';
import {
  FavouritePropertyListingResponse,
  FavouritePropertyListing,
  ProductsListingResponse,
  PropertyApiRoutes,
  getEndpointProps,
} from '../../api/constants';
import api from '../../api';

interface AppStateProps {
  favourites?: FavouritePropertyListingResponse;
  error: boolean;
}

const ListingPage = ({favourites}: AppStateProps): JSX.Element => {
  const {isAuthenticated} = useStoreState((s) => s.auth);

  // swr
  const {data: userFavourites} = useGetRequest<
    FavouritePropertyListingResponse
  >(
    {
      url: getEndpointProps(PropertyApiRoutes.LIST_FAVOURITE_PROPERTIES).path,
      headers: {Authorization: `Bearer ${getToken()}`},
    },
    {initialData: favourites}
  );
  const {data: listings, error: listingsError} = useGetRequest<
    ProductsListingResponse
  >({
    url: getEndpointProps(PropertyApiRoutes.GET_PROPERTY_LISTINGS).path,
    headers: {Authorization: `Bearer ${getToken()}`},
  });

  useEffect(() => {
    if (!isAuthenticated) {
      Router.push('/signin');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  if (listingsError) {
    return <div>failed to load</div>;
  }

  if (!listings) {
    return <div>loading...</div>;
  }

  return (
    <>
      <SidebarContextProvider>
        <BodyWrapper>
          <div tw="flex h-screen bg-gray-200">
            <Sidebar />

            <div tw="flex flex-col flex-1 overflow-hidden">
              <Header />

              <main tw="flex flex-col flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
                <DashboardPage
                  listings={listings.data}
                  favourites={userFavourites?.data || []}
                />
              </main>
            </div>
          </div>
        </BodyWrapper>
      </SidebarContextProvider>
    </>
  );
};

const getCookieFromReq = (req, cookieKey): string | null => {
  const cookie = req?.headers?.cookie
    ?.split(';')
    ?.find((c) => c.trim().startsWith(`${cookieKey}=`));

  if (!cookie) {
    return null;
  }

  return cookie.split('=')[1];
};

// page is server-side rendered.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
ListingPage.getInitialProps = async (appContext: NextPageContext) => {
  try {
    // Parse
    const token: string | null = getCookieFromReq(appContext?.req, 'token');

    console.log('no token', token);

    if (token) {
      const {data}: {data: FavouritePropertyListingResponse} = await api({
        key: PropertyApiRoutes.LIST_FAVOURITE_PROPERTIES,
        isServer: true,
        token,
      });

      return {props: {error: false, favourites: data}};
    }
  } catch (err) {
    console.log('SSR Error!');
    // console.log(err);
  }

  return {props: {error: true}};
};

export default ListingPage;