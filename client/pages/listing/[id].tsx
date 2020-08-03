import Router, {useRouter} from 'next/router';
import React, {useEffect} from 'react';
import {NextPageContext} from 'next';
import tw, {css} from 'twin.macro';

import BodyWrapper from '../../components/BodyWrapper';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Loader from '../../components/Loader';

import {SidebarContextProvider} from '../../contexts/sidebar-context';
import {getToken, getCookieFromReq} from '../../util/token';
import useGetRequest from '../../api/useGetRequest';
import {useStoreState} from '../../state/store';
import {
  PropertyListingResponse,
  PropertyApiRoutes,
  getEndpointProps,
  AppRoutes,
} from '../../api/constants';
import api from '../../api';

interface AppStateProps {
  initialDetails?: PropertyListingResponse;
  error: boolean;
}

const PropertyListingViewPage = ({
  initialDetails,
}: AppStateProps): JSX.Element => {
  const {isAuthenticated} = useStoreState((s) => s.auth);
  const router = useRouter();
  const {id} = router.query;

  // get property listings using swr
  const {data: propertyListing, error: propertyListingError} = useGetRequest<
    PropertyListingResponse
  >(
    {
      url: `${
        getEndpointProps(PropertyApiRoutes.GET_PROPERTY_LISTING).path
      }/${id}`, // Note: id is being appended to path
      headers: {Authorization: `Bearer ${getToken()}`},
    },
    {initialData: initialDetails}
  );

  useEffect(() => {
    if (!isAuthenticated) {
      Router.push(AppRoutes.SIGN_IN);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  if (propertyListingError) {
    return <div>failed to load data</div>;
  }

  if (!propertyListing) {
    return (
      <BodyWrapper>
        <Loader />
      </BodyWrapper>
    );
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
                <section tw="flex flex-1 flex-col sm:flex-row">
                  <div
                    css={[
                      tw`flex-shrink p-6 bg-white`,

                      css`
                        flex-grow: 2;
                        flex-basis: 0%;
                      `,
                    ]}
                  >
                    <div tw="container px-6 mx-auto flex justify-center">
                      <div tw="md:flex md:items-center">
                        <div tw="md:w-1/2 w-full h-64">
                          <img
                            tw="object-cover w-full h-full max-w-lg mx-auto rounded-md"
                            src={propertyListing.data.photos[0].url}
                            alt="Property"
                          />
                        </div>
                        <div tw="md:ml-8 md:mt-0 md:w-1/2 w-full max-w-lg mx-auto mt-5">
                          <h3 tw="text-3xl text-black uppercase">
                            {propertyListing.data.title}
                          </h3>

                          <p tw="py-3 text-xl text-gray-700 font-semibold">
                            &#8377; {propertyListing.data.price}
                          </p>

                          <div tw="flex flex-row justify-between items-center">
                            <div>
                              <p>{propertyListing.data.address.street}</p>
                            </div>

                            <div tw="flex flex-row">
                              <div>
                                <p tw="pr-4 text-gray-500">
                                  {propertyListing.data.noOfRooms} rooms
                                </p>
                              </div>

                              <div>
                                <p tw="pr-4 text-gray-500">
                                  {propertyListing.data.noOfBathRooms} baths
                                </p>
                              </div>

                              <div>
                                <p tw="text-gray-500">
                                  {propertyListing.data.squareFeet} ft
                                  <sup>2</sup>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p>
                              {propertyListing.data.address.zipCode.city.name},{' '}
                              {propertyListing.data.address.zipCode.state.name},{' '}
                              {
                                propertyListing.data.address.zipCode.country
                                  .name
                              }
                            </p>
                          </div>

                          <div>
                            <h2 tw="uppercase font-medium text-lg">
                              Description
                            </h2>
                          </div>

                          <div>{propertyListing.data.longDescription}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </main>
            </div>
          </div>
        </BodyWrapper>
      </SidebarContextProvider>
    </>
  );
};

// page is server-side rendered.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
PropertyListingViewPage.getInitialProps = async (
  appContext: NextPageContext
) => {
  const id = appContext.query.id as string;

  try {
    const token: string | null = getCookieFromReq(appContext?.req);

    if (token && id) {
      const {data}: {data: PropertyListingResponse} = await api({
        key: PropertyApiRoutes.GET_PROPERTY_LISTING,
        isServer: true,
        token,
        route: [id],
      });

      return {error: false, initialDetails: data};
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    console.log('SSR Error!');
  }

  return {error: true};
};

export default PropertyListingViewPage;
