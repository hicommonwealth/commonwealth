import { check } from 'k6';
import http from 'k6/http';
import { URL } from 'url';

// Single API URL for local debugging
// const BASE_URL = 'http://localhost:3000/api/v1/rest/';
const BASE_URL =
  `http://${__ENV.BASE_URL}/` || 'http://localhost:3000/api/v1/rest/';
const JWT_token = '';

export const options = {
  scenarios: {
    GetMembers: {
      executor: 'constant-vus',
      exec: 'GetMembers',
      vus: 3,
      duration: '3s',
    },
    GetBulkThreads: {
      executor: 'constant-vus',
      exec: 'GetBulkThreads',
      vus: 3,
      duration: '3s',
    },
    GetGlobalActivity: {
      executor: 'constant-vus',
      exec: 'GetGlobalActivity',
      vus: 3,
      duration: '3s',
    },
  },
};

export async function GetMembers() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${BASE_URL}rest/query/GetMembers`);
  url.searchParams.append('limit', '10');
  url.searchParams.append('community_id', 'layerzero');
  url.searchParams.append('cursor', '1');
  console.log(url.toString());

  const res = http.get(url.toString(), header);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}

export async function GetBulkThreads() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${BASE_URL}rest/query/GetMembers`);
  url.searchParams.append('limit', '10');
  url.searchParams.append('community_id', 'layerzero');
  url.searchParams.append('cursor', '1');

  // const res = http.get(url.toString(), header);
}

export async function GetGlobalActivity() {
  const header = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_token}`,
    },
  };
  const url = new URL(`${BASE_URL}rest/query/GetMembers`);
  url.searchParams.append('limit', '10');
  url.searchParams.append('community_id', 'layerzero');
  url.searchParams.append('cursor', '1');

  // const res = http.get(url.toString(), header);
}
