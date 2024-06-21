import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { check } from 'k6';
import http from 'k6/http';

// Single API URL for local debugging
// const BASE_URL = 'http://localhost:8080/api/';
const BASE_URL = `http://${__ENV.BASE_URL}/` || 'http://localhost:8080/api/';
const JWT_token = '';

export const options = {
  scenarios: {
    threads: {
      executor: 'constant-vus',
      exec: 'threads',
      vus: 3,
      duration: '3s',
    },
    communities: {
      executor: 'constant-vus',
      exec: 'communities',
      vus: 3,
      duration: '3s',
    },
    groups: {
      executor: 'constant-vus',
      exec: 'groups',
      vus: 3,
      duration: '3s',
    },
    status: {
      executor: 'constant-vus',
      exec: 'status',
      vus: 3,
      duration: '3s',
    },
    nodes: {
      executor: 'constant-vus',
      exec: 'nodes',
      vus: 3,
      duration: '3s',
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
  const url = new URL(`${BASE_URL}threads`);
  url.searchParams.append('limit', '100');
  url.searchParams.append('community_id', 'layerzero');
  url.searchParams.append('count', true);

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
  const url = new URL(`${BASE_URL}communities`);
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
  const url = new URL(`${BASE_URL}groups`);
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
  const url = new URL(`${BASE_URL}status`);
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
  const url = new URL(`${BASE_URL}status`);
  url.searchParams.append('community_id', 'layerzero');

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}
