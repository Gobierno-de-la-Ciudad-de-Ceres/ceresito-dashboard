import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';

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

function logReclamoPdf(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  reclamoId: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/reclamos/:id/pdf]', JSON.stringify(meta));
}

function jsonWithSource(
  body: unknown,
  status: number,
  source: string,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'x-core-api-source': source,
      ...(extraHeaders || {}),
    },
  });
}

function buildLegacyUrl(baseUrl: string, reclamoId: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}/reclamo/${encodeURIComponent(reclamoId)}/pdf${query}`;
}

function buildV1Url(baseUrl: string, reclamoId: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}/reclamos/${encodeURIComponent(reclamoId)}/pdf${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function safeText(response: Response): Promise<string | null> {
  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function extractErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await safeJson(response);
    return data || { error: 'upstream_request_failed' };
  }

  const text = await safeText(response);
  if (!text) return { error: 'upstream_request_failed' };

  return {
    error: 'upstream_request_failed',
    message: text,
  };
}

async function fetchLegacyPdf(reclamoId: string, request: NextRequest): Promise<Response> {
  const url = buildLegacyUrl(resolveLegacyBaseUrl(), reclamoId, request);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf, application/json',
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1Pdf(reclamoId: string, request: NextRequest): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(resolveV1BaseUrl(), reclamoId, request);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf, application/json',
        'x-api-key': adminKey,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

async function proxyPdfResponse(
  response: Response,
  reclamoId: string,
  source: string,
  extraHeaders?: Record<string, string>
) {
  const payload = await response.arrayBuffer();
  const headers = new Headers();

  headers.set('content-type', response.headers.get('content-type') || 'application/pdf');
  headers.set('cache-control', 'no-store');
  headers.set('x-core-api-source', source);

  const contentDisposition = response.headers.get('content-disposition');
  if (contentDisposition) {
    headers.set('content-disposition', contentDisposition);
  } else {
    headers.set('content-disposition', `attachment; filename="reclamo-${reclamoId}.pdf"`);
  }

  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value);
    }
  }

  return new NextResponse(payload, {
    status: response.status,
    headers,
  });
}

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const reclamoId = context.params.id?.trim();

  if (!reclamoId) {
    return jsonWithSource(
      {
        error: 'invalid_reclamo_id',
        message: 'Reclamo id is required',
      },
      400,
      'validation_error'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildLegacyUrl(resolveLegacyBaseUrl(), reclamoId, request);
    const v1Url = buildV1Url(resolveV1BaseUrl(), reclamoId, request);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacyPdf(reclamoId, request);

      if (!legacyResponse.ok) {
        const legacyPayload = await extractErrorPayload(legacyResponse);
        logReclamoPdf({
          target,
          source: 'legacy_error',
          status: legacyResponse.status,
          url: legacyUrl,
          reclamoId,
        });
        return jsonWithSource(legacyPayload, legacyResponse.status, 'legacy_error');
      }

      logReclamoPdf({
        target,
        source: 'legacy',
        status: legacyResponse.status,
        url: legacyUrl,
        reclamoId,
      });
      return proxyPdfResponse(legacyResponse, reclamoId, 'legacy');
    }

    const v1Response = await fetchV1Pdf(reclamoId, request);
    if (!v1Response) {
      logReclamoPdf({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
        reclamoId,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 reclamos/:id/pdf',
        },
        500,
        'v1_config_error'
      );
    }

    if (v1Response.ok) {
      logReclamoPdf({
        target,
        source: 'v1',
        status: v1Response.status,
        url: v1Url,
        reclamoId,
      });
      return proxyPdfResponse(v1Response, reclamoId, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      const v1Payload = await extractErrorPayload(v1Response);
      logReclamoPdf({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
        reclamoId,
      });
      return jsonWithSource(v1Payload, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacyPdf(reclamoId, request);
    if (!legacyResponse.ok) {
      const legacyPayload = await extractErrorPayload(legacyResponse);
      logReclamoPdf({
        target,
        source: 'legacy_fallback_error',
        status: legacyResponse.status,
        url: legacyUrl,
        reclamoId,
        fallback: true,
      });
      return jsonWithSource(
        legacyPayload,
        legacyResponse.status,
        'legacy_fallback_error'
      );
    }

    logReclamoPdf({
      target,
      source: 'legacy_fallback',
      status: legacyResponse.status,
      url: legacyUrl,
      reclamoId,
      fallback: true,
    });
    return proxyPdfResponse(legacyResponse, reclamoId, 'legacy_fallback', {
      'x-core-api-fallback': 'legacy',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error';
    return jsonWithSource(
      {
        error: 'upstream_unreachable',
        message,
      },
      502,
      'upstream_unreachable'
    );
  }
}
