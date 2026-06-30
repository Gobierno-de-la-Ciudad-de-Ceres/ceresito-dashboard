import { NextRequest, NextResponse } from 'next/server';

const RECLAMOS_COUNT_BY_BARRIO_PATH = '/reclamos/count-by-barrio';
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

function logReclamosCountByBarrio(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/reclamos/count-by-barrio]', JSON.stringify(meta));
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

function buildUrl(baseUrl: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}${RECLAMOS_COUNT_BY_BARRIO_PATH}${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchLegacy(request: NextRequest): Promise<Response> {
  const url = buildUrl(resolveLegacyBaseUrl(), request);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${url}:${message}`);
  }
}

async function fetchV1(request: NextRequest): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildUrl(resolveV1BaseUrl(), request);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-api-key': adminKey,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`v1_upstream_unreachable:${url}:${message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const legacyUrl = buildUrl(resolveLegacyBaseUrl(), request);
    const v1Url = buildUrl(resolveV1BaseUrl(), request);

    if (target === 'legacy') {
      const legacyResponse = await fetchLegacy(request);
      const legacyPayload = await safeJson(legacyResponse);

      if (!legacyResponse.ok) {
        logReclamosCountByBarrio({
          target,
          source: 'legacy_error',
          status: legacyResponse.status,
          url: legacyUrl,
        });
        return jsonWithSource(
          legacyPayload || { error: 'legacy_request_failed' },
          legacyResponse.status,
          'legacy_error'
        );
      }

      if (legacyPayload === null) {
        logReclamosCountByBarrio({
          target,
          source: 'legacy_invalid_payload',
          status: 502,
          url: legacyUrl,
        });
        return jsonWithSource(
          {
            error: 'invalid_legacy_payload',
            message: 'Legacy payload is not valid JSON',
          },
          502,
          'legacy_invalid_payload'
        );
      }

      logReclamosCountByBarrio({
        target,
        source: 'legacy',
        status: 200,
        url: legacyUrl,
      });
      return jsonWithSource(legacyPayload, 200, 'legacy');
    }

    const v1Response = await fetchV1(request);
    if (!v1Response) {
      logReclamosCountByBarrio({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 reclamos/count-by-barrio',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      if (v1Payload === null) {
        logReclamosCountByBarrio({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 payload is not valid JSON',
          },
          502,
          'v1_invalid_payload'
        );
      }

      logReclamosCountByBarrio({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
      });
      return jsonWithSource(v1Payload, 200, 'v1');
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logReclamosCountByBarrio({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResponse = await fetchLegacy(request);
    const legacyPayload = await safeJson(legacyResponse);

    if (!legacyResponse.ok) {
      logReclamosCountByBarrio({
        target,
        source: 'legacy_fallback_error',
        status: legacyResponse.status,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        legacyPayload || { error: 'legacy_request_failed_after_fallback' },
        legacyResponse.status,
        'legacy_fallback_error'
      );
    }

    if (legacyPayload === null) {
      logReclamosCountByBarrio({
        target,
        source: 'legacy_fallback_invalid_payload',
        status: 502,
        url: legacyUrl,
        fallback: true,
      });
      return jsonWithSource(
        {
          error: 'invalid_legacy_payload_after_fallback',
          message: 'Legacy fallback payload is not valid JSON',
        },
        502,
        'legacy_fallback_invalid_payload'
      );
    }

    logReclamosCountByBarrio({
      target,
      source: 'legacy_fallback',
      status: 200,
      url: legacyUrl,
      fallback: true,
    });
    return jsonWithSource(legacyPayload, 200, 'legacy_fallback', {
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
