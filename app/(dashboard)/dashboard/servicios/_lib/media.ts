export function getServicesBaseUrl() {
  return (process.env.NEXT_PUBLIC_SERVICES_API_URL || "").replace(/\/$/, "");
}

function getServicesProxyBaseUrl() {
  return "/api/servicios-externos";
}

function buildServicesAssetUrl(path: string) {
  const servicesBaseUrl = getServicesBaseUrl();
  if (servicesBaseUrl) {
    return `${servicesBaseUrl}${path}`;
  }

  return `${getServicesProxyBaseUrl()}${path}`;
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function extractR2ObjectKey(value: string) {
  try {
    const url = new URL(value);
    if (
      !url.hostname.endsWith(".r2.dev") &&
      !url.hostname.endsWith(".r2.cloudflarestorage.com")
    ) {
      return null;
    }

    return url.pathname.replace(/^\/+/, "") || null;
  } catch {
    return null;
  }
}

export function resolveServicesMediaSrc(src?: string | null) {
  if (!src) {
    return null;
  }

  const normalizedSrc = src.trim();

  if (!normalizedSrc) {
    return null;
  }

  if (normalizedSrc.startsWith("/api/v1/uploads/public/")) {
    return buildServicesAssetUrl(normalizedSrc);
  }

  if (normalizedSrc.startsWith("profiles/")) {
    return buildServicesAssetUrl(`/api/v1/uploads/public/${normalizedSrc}`);
  }

  const objectKeyFromAbsoluteUrl = isAbsoluteUrl(normalizedSrc)
    ? extractR2ObjectKey(normalizedSrc)
    : null;
  if (objectKeyFromAbsoluteUrl) {
    return buildServicesAssetUrl(`/api/v1/uploads/public/${objectKeyFromAbsoluteUrl}`);
  }

  if (isAbsoluteUrl(normalizedSrc)) {
    return normalizedSrc;
  }

  if (normalizedSrc.startsWith("/uploads/")) {
    return buildServicesAssetUrl(normalizedSrc);
  }

  // Imágenes estáticas del catálogo (seed: /images/servicios/*, /images/profesionales/*)
  if (normalizedSrc.startsWith("/images/")) {
    return buildServicesAssetUrl(normalizedSrc);
  }

  return normalizedSrc;
}

export function getUserInitials(firstName?: string | null, lastName?: string | null) {
  const initials = [firstName, lastName]
    .map((value) => value?.trim()?.charAt(0) || "")
    .join("")
    .toUpperCase();

  return initials || "P";
}
