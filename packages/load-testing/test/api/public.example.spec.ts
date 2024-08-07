import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { check } from 'k6';
import http from 'k6/http';
import { LEGACY_API_URL } from '../util/config.ts';

const JWT_token = '';

export const options = {
  scenarios: {
    threads: {
      executor: 'constant-vus',
      exec: 'threads',
      vus: 3,
      duration: '1m',
    },
    communities: {
      executor: 'constant-vus',
      exec: 'communities',
      vus: 3,
      duration: '1m',
    },
    groups: {
      executor: 'constant-vus',
      exec: 'groups',
      vus: 3,
      duration: '1m',
    },
    status: {
      executor: 'constant-vus',
      exec: 'status',
      vus: 3,
      duration: '30s',
    },
    nodes: {
      executor: 'constant-vus',
      exec: 'nodes',
      vus: 3,
      duration: '1m',
    },
  },
};

export async function threads() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${LEGACY_API_URL}/threads`);
  url.searchParams.append('limit', '100');
  url.searchParams.append('community_id', 'layerzero');
  url.searchParams.append('count', 'true');

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}

export async function communities() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${LEGACY_API_URL}/communities`);
  //   url.searchParams.append('limit', '10');
  //   url.searchParams.append('community_id', 'layerzero');
  //   url.searchParams.append('count', true);
  //   console.log(url.toString());

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}

export async function groups() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${LEGACY_API_URL}/groups`);
  url.searchParams.append('community_id', 'layerzero');

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}

export async function status() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${LEGACY_API_URL}/status`);
  url.searchParams.append('community_id', 'layerzero');

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}

export async function nodes() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${LEGACY_API_URL}/status`);
  url.searchParams.append('community_id', 'layerzero');

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}
