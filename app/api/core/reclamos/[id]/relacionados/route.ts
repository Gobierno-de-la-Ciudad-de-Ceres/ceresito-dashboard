import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LEGACY_BASE_URL = 'https://api.ceres.gob.ar/api/api';
const DEFAULT_V1_BASE_URL = 'https://api.ceres.gob.ar/api/v1';

type Target = 'legacy' | 'v1';

type ReclamoRelacionado = {
  id: number;
  fecha: string | null;
  reclamo: string | null;
  estado: string | null;
  barrio: string | null;
  ubicacion: string | null;
  detalle: string | null;
};

type RelacionadosResponse = {
  data: ReclamoRelacionado[];
  total: number;
};

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

function logReclamosRelacionados(meta: {
  target: Target;
  source: string;
  status: number;
  url: string;
  reclamoId: string;
  fallback?: boolean;
}) {
  if (!shouldLogDebug()) return;
  console.log('[core-api/reclamos/:id/relacionados]', JSON.stringify(meta));
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

function buildLegacyDetailUrl(baseUrl: string, reclamoId: string): string {
  return `${normalizeBaseUrl(baseUrl)}/reclamo/${encodeURIComponent(reclamoId)}`;
}

function buildLegacyByPhonePrimaryUrl(baseUrl: string, telefono: string): string {
  return `${normalizeBaseUrl(baseUrl)}/reclamos/telefono/${encodeURIComponent(telefono)}`;
}

function buildLegacyByPhoneCompatUrl(baseUrl: string, telefono: string): string {
  return `${normalizeBaseUrl(baseUrl)}/reclamo/telefono/${encodeURIComponent(telefono)}`;
}

function buildV1Url(baseUrl: string, reclamoId: string, request: NextRequest): string {
  const query = request.nextUrl.search || '';
  return `${normalizeBaseUrl(baseUrl)}/reclamos/${encodeURIComponent(reclamoId)}/relacionados${query}`;
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toNumberOrNull(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toRelacionado(item: unknown): ReclamoRelacionado | null {
  if (!item || typeof item !== 'object') return null;

  const obj = item as Record<string, unknown>;
  const id = toNumberOrNull(obj.id);
  if (id === null) return null;

  return {
    id,
    fecha: toStringOrNull(obj.fecha),
    reclamo: toStringOrNull(obj.reclamo),
    estado: toStringOrNull(obj.estado),
    barrio: toStringOrNull(obj.barrio),
    ubicacion: toStringOrNull(obj.ubicacion),
    detalle: toStringOrNull(obj.detalle),
  };
}

function normalizeRelacionadosPayload(payload: unknown): RelacionadosResponse | null {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    const data = payload
      .map((item) => toRelacionado(item))
      .filter((item): item is ReclamoRelacionado => item !== null);

    return {
      data,
      total: data.length,
    };
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      const data = obj.data
        .map((item) => toRelacionado(item))
        .filter((item): item is ReclamoRelacionado => item !== null);

      const totalRaw = Number(obj.total);
      const total = Number.isFinite(totalRaw) ? totalRaw : data.length;

      return {
        data,
        total,
      };
    }
  }

  return null;
}

async function fetchLegacyDetail(reclamoId: string): Promise<Response> {
  const url = buildLegacyDetailUrl(resolveLegacyBaseUrl(), reclamoId);

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

async function fetchLegacyByPhoneWithCompatibility(
  telefono: string
): Promise<{ response: Response; url: string; usedCompat: boolean }> {
  const primaryUrl = buildLegacyByPhonePrimaryUrl(resolveLegacyBaseUrl(), telefono);

  try {
    const primaryResponse = await fetch(primaryUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (primaryResponse.status !== 404) {
      return {
        response: primaryResponse,
        url: primaryUrl,
        usedCompat: false,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${primaryUrl}:${message}`);
  }

  const compatUrl = buildLegacyByPhoneCompatUrl(resolveLegacyBaseUrl(), telefono);

  try {
    const compatResponse = await fetch(compatUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    return {
      response: compatResponse,
      url: compatUrl,
      usedCompat: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`legacy_upstream_unreachable:${compatUrl}:${message}`);
  }
}

async function fetchV1Relacionados(
  request: NextRequest,
  reclamoId: string
): Promise<Response | null> {
  const adminKey = resolveCoreAdminKey();
  if (!adminKey) return null;

  const url = buildV1Url(resolveV1BaseUrl(), reclamoId, request);

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

async function resolveLegacyRelacionados(
  reclamoId: string
): Promise<{
  status: number;
  source: string;
  payload: unknown;
  url: string;
}> {
  const detailUrl = buildLegacyDetailUrl(resolveLegacyBaseUrl(), reclamoId);
  const detailResponse = await fetchLegacyDetail(reclamoId);
  const detailPayload = await safeJson(detailResponse);

  if (!detailResponse.ok) {
    return {
      status: detailResponse.status,
      source: 'legacy_detail_error',
      payload: detailPayload || { error: 'legacy_detail_request_failed' },
      url: detailUrl,
    };
  }

  if (!detailPayload || typeof detailPayload !== 'object') {
    return {
      status: 502,
      source: 'legacy_detail_invalid_payload',
      payload: {
        error: 'invalid_legacy_payload',
        message: 'Legacy detail payload is not valid JSON',
      },
      url: detailUrl,
    };
  }

  const telefono = (detailPayload as Record<string, unknown>).telefono;
  if (typeof telefono !== 'string' || !telefono.trim()) {
    return {
      status: 200,
      source: 'legacy_no_phone',
      payload: {
        data: [],
        total: 0,
      },
      url: detailUrl,
    };
  }

  const { response, url, usedCompat } = await fetchLegacyByPhoneWithCompatibility(telefono);
  const byPhonePayload = await safeJson(response);

  if (!response.ok) {
    return {
      status: response.status,
      source: usedCompat ? 'legacy_compat_error' : 'legacy_error',
      payload: byPhonePayload || { error: 'legacy_request_failed' },
      url,
    };
  }

  const normalized = normalizeRelacionadosPayload(byPhonePayload);
  if (!normalized) {
    return {
      status: 502,
      source: usedCompat ? 'legacy_compat_invalid_payload' : 'legacy_invalid_payload',
      payload: {
        error: 'invalid_legacy_payload',
        message: 'Legacy relacionados payload is not valid JSON',
      },
      url,
    };
  }

  const reclamoIdNumber = Number(reclamoId);
  const filteredData = normalized.data.filter((item) =>
    Number.isFinite(reclamoIdNumber) ? item.id !== reclamoIdNumber : true
  );

  return {
    status: 200,
    source: usedCompat ? 'legacy_compat' : 'legacy',
    payload: {
      data: filteredData,
      total: filteredData.length,
    },
    url,
  };
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
        error: 'validation_error',
        message: 'Reclamo id is required',
      },
      400,
      'validation_error'
    );
  }

  try {
    const target = resolveTarget();
    const failoverToLegacy = shouldFailover();
    const v1Url = buildV1Url(resolveV1BaseUrl(), reclamoId, request);

    if (target === 'legacy') {
      const legacyResult = await resolveLegacyRelacionados(reclamoId);

      logReclamosRelacionados({
        target,
        source: legacyResult.source,
        status: legacyResult.status,
        url: legacyResult.url,
        reclamoId,
      });

      return jsonWithSource(legacyResult.payload, legacyResult.status, legacyResult.source);
    }

    const v1Response = await fetchV1Relacionados(request, reclamoId);
    if (!v1Response) {
      logReclamosRelacionados({
        target,
        source: 'v1_config_error',
        status: 500,
        url: v1Url,
        reclamoId,
      });
      return jsonWithSource(
        {
          error: 'configuration_error',
          message: 'CORE_API_ADMIN_KEY or ADMIN_API_KEY is required for v1 reclamos/:id/relacionados',
        },
        500,
        'v1_config_error'
      );
    }

    const v1Payload = await safeJson(v1Response);
    if (v1Response.ok) {
      const normalizedV1 = normalizeRelacionadosPayload(v1Payload);
      if (!normalizedV1) {
        logReclamosRelacionados({
          target,
          source: 'v1_invalid_payload',
          status: 502,
          url: v1Url,
          reclamoId,
        });
        return jsonWithSource(
          {
            error: 'invalid_v1_payload',
            message: 'v1 relacionados payload is not valid JSON',
          },
          502,
          'v1_invalid_payload'
        );
      }

      const reclamoIdNumber = Number(reclamoId);
      const filteredData = normalizedV1.data.filter((item) =>
        Number.isFinite(reclamoIdNumber) ? item.id !== reclamoIdNumber : true
      );

      logReclamosRelacionados({
        target,
        source: 'v1',
        status: 200,
        url: v1Url,
        reclamoId,
      });
      return jsonWithSource(
        {
          data: filteredData,
          total: filteredData.length,
        },
        200,
        'v1'
      );
    }

    const canFallback =
      failoverToLegacy && (v1Response.status === 404 || v1Response.status === 501);

    if (!canFallback) {
      logReclamosRelacionados({
        target,
        source: 'v1_error',
        status: v1Response.status,
        url: v1Url,
        reclamoId,
      });
      return jsonWithSource(v1Payload || { error: 'v1_request_failed' }, v1Response.status, 'v1_error');
    }

    const legacyResult = await resolveLegacyRelacionados(reclamoId);

    logReclamosRelacionados({
      target,
      source: 'legacy_fallback',
      status: legacyResult.status,
      url: legacyResult.url,
      reclamoId,
      fallback: true,
    });

    return jsonWithSource(legacyResult.payload, legacyResult.status, 'legacy_fallback', {
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
