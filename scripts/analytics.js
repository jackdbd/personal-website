const { gql, GraphQLClient, request } = require('graphql-request');

const makeDomains = (gqlClient) => {
  const query = gql`
    query getDomains {
      domains {
        id
        title
      }
    }
  `;
  return async function domains() {
    try {
      const data = await gqlClient.request(query);
      return data.domains;
    } catch (err) {
      throw err;
    }
  };
};

const makeFactsByDomainId = (gqlClient, domainId) => {
  const query = gql`
    query getFactsByDomainId($domainId: ID!) {
      domain(id: $domainId) {
        id
        title
        facts {
          activeVisitors
          averageViews
          averageDuration
          viewsToday
          viewsMonth
          viewsYear
        }
      }
    }
  `;
  const variables = {
    domainId
  };
  return async function facts() {
    try {
      const data = await gqlClient.request(query, variables);
      return data.domain.facts;
    } catch (err) {
      throw err;
    }
  };
};

const makeDomainsFacts = (gqlClient) => {
  const query = gql`
    query getDomainsFacts {
      domains {
        id
        title
        facts {
          activeVisitors
          averageViews
          averageDuration
          viewsToday
          viewsMonth
          viewsYear
        }
      }
    }
  `;
  return async function domainsFacts() {
    try {
      const data = await gqlClient.request(query);
      return data.domains;
    } catch (err) {
      throw err;
    }
  };
};

const makeEvents = (gqlClient) => {
  const query = gql`
    query getEvents {
      events {
        id
        title
        statistics {
          chart(interval: DAILY, type: TOTAL) {
            id
            count
          }
          list(sorting: TOP, type: TOTAL) {
            id
            count
          }
        }
      }
    }
  `;
  return async function domains() {
    try {
      const data = await gqlClient.request(query);
      return data.events;
    } catch (err) {
      throw err;
    }
  };
};

const makeTopPages = (gqlClient, domainId, numPages) => {
  const query = gql`
    query topPagesByDomainId($domainId: ID!, $numPages: Int!) {
      domain(id: $domainId) {
        title
        statistics {
          pages(limit: $numPages, sorting: TOP) {
            id
            count
          }
        }
      }
    }
  `;
  const variables = {
    domainId,
    numPages
  };
  return async function topPages() {
    try {
      const data = await gqlClient.request(query, variables);
      return data.domain.statistics.pages;
    } catch (err) {
      throw err;
    }
  };
};

const makeAnalyticsClient = ({ endpoint, domainId, token }) => {
  const gqlClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  return {
    domains: makeDomains(gqlClient),
    domainsFacts: makeDomainsFacts(gqlClient),
    events: makeEvents(gqlClient),
    facts: makeFactsByDomainId(gqlClient, domainId),
    topFivePages: makeTopPages(gqlClient, domainId, 5),
    topTenPages: makeTopPages(gqlClient, domainId, 10)
  };
};

// Get a Bearer token from my self-hosted analytics server (Ackee)
const getBearerToken = async ({ endpoint, username, password }) => {
  const query = gql`
    mutation createToken($input: CreateTokenInput!) {
      createToken(input: $input) {
        payload {
          id
        }
      }
    }
  `;
  const variables = {
    input: {
      username,
      password
    }
  };

  try {
    const data = await request(endpoint, query, variables);
    return data.createToken.payload.id;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getBearerToken,
  makeAnalyticsClient
};
