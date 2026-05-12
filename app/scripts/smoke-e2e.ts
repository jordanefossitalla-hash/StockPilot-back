/* eslint-disable no-console */

type Json = Record<string, unknown>;

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';
const SMOKE_ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@stockpilot.local';
const SMOKE_ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'Admin123!';

async function requestJson<T = Json>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('content-type', 'application/json');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} ${path} -> ${body}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const runId = Date.now().toString();
  console.log('[SMOKE] Starting smoke scenario on', API_BASE_URL);

  const login = await requestJson<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: SMOKE_ADMIN_EMAIL,
      password: SMOKE_ADMIN_PASSWORD,
    }),
  });

  assert(login.accessToken, 'Missing accessToken from login');
  const token = login.accessToken;
  console.log('[SMOKE] Auth OK');

  const client = await requestJson<{ data: { id: string } }>(
    '/clients',
    {
      method: 'POST',
      body: JSON.stringify({
        code: `CL-${runId}`,
        name: `Client Smoke ${runId}`,
        status: 'ACTIVE',
      }),
    },
    token,
  );

  const supplier = await requestJson<{ data: { id: string } }>(
    '/suppliers',
    {
      method: 'POST',
      body: JSON.stringify({
        code: `SUP-${runId}`,
        name: `Supplier Smoke ${runId}`,
        status: 'ACTIVE',
      }),
    },
    token,
  );

  const product = await requestJson<{ data: { id: string; sku: string } }>(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        sku: `SKU-${runId}`,
        name: `Product Smoke ${runId}`,
        costPrice: 100,
        salePrice: 150,
        stockMinThreshold: 5,
        status: 'ACTIVE',
      }),
    },
    token,
  );

  const productId = product.data.id;
  console.log('[SMOKE] Master data OK');

  await requestJson('/stock/entries', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      quantity: 20,
      unitCost: 100,
      note: 'Smoke entry',
    }),
  }, token);

  const status = await requestJson<{ data: Array<{ id: string; stockQuantity: number }> }>(
    `/stock/status?search=${encodeURIComponent(`SKU-${runId}`)}`,
    { method: 'GET' },
    token,
  );
  const statusProduct = status.data.find((x) => x.id === productId);
  assert(statusProduct && statusProduct.stockQuantity >= 20, 'Stock entry not reflected');
  console.log('[SMOKE] Stock entry/status OK');

  const sale = await requestJson<{ data: { id: string } }>(
    '/sales',
    {
      method: 'POST',
      body: JSON.stringify({
        clientId: client.data.id,
        items: [{ productId, quantity: 2, unitPrice: 150 }],
        paidAmount: 100,
        note: 'Smoke sale',
      }),
    },
    token,
  );

  await requestJson(`/sales/${sale.data.id}`, { method: 'GET' }, token);
  console.log('[SMOKE] Sale flow OK');

  const order = await requestJson<{ data: { id: string } }>(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        supplierId: supplier.data.id,
        items: [{ productId, quantity: 5, unitCost: 100 }],
      }),
    },
    token,
  );

  await requestJson(`/orders/${order.data.id}/receive`, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId, quantity: 5 }],
    }),
  }, token);
  console.log('[SMOKE] Order receive flow OK');

  await requestJson('/dashboard/metrics', { method: 'GET' }, token);
  await requestJson('/dashboard/top-products', { method: 'GET' }, token);
  console.log('[SMOKE] Dashboard endpoints OK');

  console.log('[SMOKE] SUCCESS');
}

run().catch((error) => {
  console.error('[SMOKE] FAILED', error);
  process.exit(1);
});
