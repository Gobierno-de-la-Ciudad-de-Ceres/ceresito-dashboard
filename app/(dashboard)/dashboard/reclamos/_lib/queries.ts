import "server-only"

import { unstable_noStore as noStore } from "next/cache"
import { headers } from "next/headers"
import type { GetTasksSchema } from "./validations"

function resolveInternalOrigin() {
  try {
    const requestHeaders = headers()
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http")

    if (host) {
      return `${protocol}://${host}`
    }
  } catch {
    // Fallback for contexts without request headers
  }

  return "http://localhost:3000"
}

export async function getTasks(input: GetTasksSchema) {
  noStore()
  
  const { page, per_page, sort, estado, prioridad, from, to, search } = input

  try {
    const fromDay = from ? new Date(from).toISOString() : undefined
    const toDay = to ? new Date(to).toISOString() : undefined

    // Construir la URL al proxy interno con los parámetros de paginación
    let apiUrl = `${resolveInternalOrigin()}/api/core/reclamos?page=${page}&per_page=${per_page}`

    // Si no se especifica un orden, el backend aplicará el orden por defecto (ID descendente)
    if (sort) {
      const [column, order] = sort.split(".")
      apiUrl += `&sort=${column}&order=${order}`
    }

    // Parámetros de búsqueda
    if (search) {
      apiUrl += `&search=${encodeURIComponent(search)}`
    }
    
    // Filtro de estado
    if (estado) {
      apiUrl += `&estado=${encodeURIComponent(estado)}`
    }
    
    // Filtro de prioridad
    if (prioridad) {
      apiUrl += `&prioridad=${encodeURIComponent(prioridad)}`
    }
    
    // Fechas
    if (fromDay) apiUrl += `&from=${fromDay}`
    if (toDay) apiUrl += `&to=${toDay}`

    const response = await fetch(apiUrl, { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Error al obtener los reclamos de la API externa")
    }

    const { data, total } = await response.json()
    
    const pageCount = Math.ceil(total / per_page)
    return { data, pageCount }
  } catch (err) {
    console.error("Error al obtener reclamos:", err)
    return { data: [], pageCount: 0 }
  }
}

export async function getTaskCountByStatus() {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/count-by-status`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Error al obtener el conteo de reclamos por estado")
    }
    return await response.json()
  } catch (err) {
    console.error("Error al obtener conteo por estado:", err)
    return []
  }
}

export async function getTaskCountByPriority() {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/count-by-priority`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Error al obtener el conteo de reclamos por prioridad")
    }
    return await response.json()
  } catch (err) {
    console.error("Error al obtener conteo por prioridad:", err)
    return []
  }
}
