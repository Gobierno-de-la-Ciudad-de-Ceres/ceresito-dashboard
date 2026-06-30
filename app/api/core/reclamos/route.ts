import { NextRequest, NextResponse } from 'next/server';

const LEGACY_LIST_PATH = '/reclamos';
const LEGACY_CREATE_PATH = '/reclamo/crear';
const V1_RECLAMOS_PATH = '/reclamos';
const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';
type AllowedMethod = 'GET' | 'POST';

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveTarget(): Target {
  const value = (process.env.CORE_API_TARGET || 'v1').toLowerCase();
  return value === 'v1' ? 'v1' : 'legacy';
}

function shouldFailover(): boolean {
  if (process.env.CORE_API_FAILOVER_TO_LEGACY === undefined) return true;
  return process.env.CORE_API_FAILOVER_TO_LEGACY.toLowerCase() !== 'false';
}

function resolveLegacyBaseUrl(): string {
  return process.env.CORE_API_LEGACY_BASE_URL || DEFAULT_LEGACY_BASE_URL;
}

function resolveV1BaseUrl(): string {
  return process.env.CORE_API_V1_BASE_URL || DEFAULT_V1_BASE_URL;
}

function resolveCoreAdminKey(): string | undefined {
  return process.env.CORE_API_ADMIN_KEY || process.env.ADMIN_API_KEY;
}

function shouldLogDebug(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.CORE_API_DEBUG === 'true';
}

function isAllowedMethod(method: string): method is AllowedMethod {
  return method === 'GET' || method === 'POST';
}

function canFallbackToLegacy(method: AllowedMethod, status: number): boolean {
  if (method === 'POST') {
    return status === 401 || status === 403 || status === 404 || status === 501;
  }

  return status === 404 || status === 501;
}

function buildLegacyUrl(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveLegacyBaseUrl());
  const query = request.nextUrl.search || '';
  const path = request.method === 'POST' ? LEGACY_CREATE_PATH : LEGACY_LIST_PATH;
  return `${baseUrl}${path}${query}`;
}

function buildV1Url(request: NextRequest): string {
  const baseUrl = normalizeBaseUrl(resolveV1BaseUrl());
  const query = request.nextUrl.search || '';
  return `${baseUrl}${V1_RECLAMOS_PATH}${query}`;
}

function logReclamos(meta: {
  method: AllowedMethod;
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/reclamos]', JSON.stringify(meta));
}

function responseWithSource(
  body: unknown,
  status: number,
  source: string,
  options?: {
    extraHeaders?: Record<string, string>;
    isText?: boolean;
    contentType?: string | null;
  }
) {
  const headers: Record<string, string> = {
    'x-core-api-source': source,
    ...(options?.extraHeaders || {}),
  };

  if (options?.isText) {
    headers['content-type'] = options.contentType || 'text/plain; charset=utf-8';
    return new NextResponse(typeof body === 'string' ? body : String(body ?? ''), {
      status,
      headers,
    });
  }

  return NextResponse.json(body, {
    status,
    headers,
  });
}

async function readRequestBody(request: NextRequest): Promise<{
  raw: string | null;
  contentType: string | null;
}> {
  if (request.method !== 'POST') {
    return { raw: null, contentType: null };
  }

  const raw = await request.text();
  return {
    raw: raw.length > 0 ? raw : null,
    contentType: request.headers.get('content-type'),
  };
}

async function safePayload(response: Response): Promise<{
  payload: unknown;
  isText: boolean;
  contentType: string | null;
}> {
  const contentType = response.headers.get('content-type');
  const text = await response.text();

  if (!text) {
    return { payload: null, isText: false, contentType };
  }

  try {
    return {
      payload: JSON.parse(text),
      isText: false,
      contentType,
    };
  } catch {
    return {
      payload: text,
      isText: true,
      contentType,
    };
  }
}

async function fetchLegacy(
  request: NextRequest,
  body: string | null,
  contentType: string | null
): Promise<Response> {
  const url = buildLegacyUrl(request);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== null) {
    headers['Content-Type'] = contentType || 'application/json';
  }

  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1(
  request: NextRequest,
  body: string | null,
  contentType: string | null
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(request);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-api-key': adminKey,
  };
  if (body !== null) {
    headers['Content-Type'] = contentType || 'application/json';
  }

  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

async function handleRequest(request: NextRequest) {
  if (!isAllowedMethod(request.method)) {
    return responseWithSource(
      {
        error: 'method_not_allowed',
        message: `Method ${request.method} not allowed`,
      },
      405,
      'method_not_allowed'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildLegacyUrl(request);
    const v1Url = buildV1Url(request);
    const { raw: body, contentType } = await readRequestBody(request);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacy(request, body, contentType);
      const legacyPayload = await safePayload(legacyResponse);
      const source = legacyResponse.ok ? 'legacy' : 'legacy_error';

      logReclamos({
        method: request.method,
        target,
        source,
        status: legacyResponse.status,
        url: legacyUrl,
      });

      return responseWithSource(legacyPayload.payload, legacyResponse.status, source, {
        isText: legacyPayload.isText,
        contentType: legacyPayload.contentType,
      });
    }

    const v1Response = await fetchV1(request, body, contentType);
    if (!v1Response) {
      logReclamos({
        method: request.method,
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return responseWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 reclamos',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safePayload(v1Response);
    if (v1Response.ok) {
      logReclamos({
        method: request.method,
        target,
        source: 'v1',
        status: v1Response.status,
        url: v1Url,
      });
      return responseWithSource(v1Payload.payload, v1Response.status, 'v1', {
        isText: v1Payload.isText,
        contentType: v1Payload.contentType,
      });
    }

    const canFallback = failoverToLegacy && canFallbackToLegacy(request.method, v1Response.status);
    if (!canFallback) {
      logReclamos({
        method: request.method,
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return responseWithSource(v1Payload.payload, v1Response.status, 'v1_error', {
        isText: v1Payload.isText,
        contentType: v1Payload.contentType,
      });
    }

    const legacyResponse = await fetchLegacy(request, body, contentType);
    const legacyPayload = await safePayload(legacyResponse);
    const source = legacyResponse.ok ? 'legacy_fallback' : 'legacy_fallback_error';

    logReclamos({
      method: request.method,
      target,
      source,
      status: legacyResponse.status,
      url: legacyUrl,
      fallback: true,
    });

    return responseWithSource(legacyPayload.payload, legacyResponse.status, source, {
      extraHeaders: legacyResponse.ok ? { 'x-core-api-fallback': 'legacy' } : undefined,
      isText: legacyPayload.isText,
      contentType: legacyPayload.contentType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error';
    return responseWithSource(
      {
        error: 'upstream_unreachable',
        message,
      },
      502,
      'upstream_unreachable'
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
