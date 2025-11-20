// The Graph Subgraph URL - 需要替换为你实际部署的subgraph URL
export const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/119822/wallet-transfer-subgraph/version/latest';

// GraphQL queries
export const GET_TRANSFERS_QUERY = `
  query GetTransfers($first: Int!, $skip: Int!, $orderBy: Transfer_orderBy, $orderDirection: OrderDirection) {
    transfers(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      from
      to
      amount
      timestamp
      blockNumber
      transactionHash
    }
  }
`;

export const GET_USER_TRANSFERS_QUERY = `
  query GetUserTransfers($userAddress: Bytes!, $first: Int!, $skip: Int!) {
    transfers(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: {
        or: [
          { from: $userAddress }
          { to: $userAddress }
        ]
      }
    ) {
      id
      from
      to
      amount
      timestamp
      blockNumber
      transactionHash
    }
  }
`;
