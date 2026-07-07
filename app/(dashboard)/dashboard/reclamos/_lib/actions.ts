"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getErrorMessage } from "@/lib/handle-error"
import type { CreateTaskSchema, UpdateTaskSchema } from "./validations"

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

function revalidateReclamosList() {
  revalidatePath("/dashboard/reclamos")
  revalidatePath("/dashboard/reclamos", "layout")
}
// Función para crear una nueva tarea en la API externa
export async function createTask(input: CreateTaskSchema) {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reclamo: input.reclamo,
        nombre: input.nombre,
        telefono: input.telefono,
        detalle: input.detalle,
        ubicacion: input.ubicacion,
        barrio: input.barrio,
        estado: input.estado,
        prioridad: input.prioridad,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al crear el reclamo en la API externa")
    }

    revalidateReclamosList()

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

// Función para actualizar una tarea existente en la API externa
export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  noStore();
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/${input.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        reclamo: input.reclamo,
        nombre: input.nombre,
        telefono: input.telefono,
        detalle: input.detalle,
        ubicacion: input.ubicacion,
        barrio: input.barrio,
        estado: input.estado,
        prioridad: input.prioridad,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text(); 
      throw new Error(`Error al actualizar el reclamo: ${errorText}`);
    }

    revalidateReclamosList();

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateTasks(input: {
  ids: string[]
  estado?: string
  prioridad?: string
}) {
  noStore()
  try {
    await Promise.all(
      input.ids.map(async (id) => {
        const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: input.estado,
            prioridad: input.prioridad,
          }),
        })

        if (!response.ok) {
          throw new Error(`Error al actualizar el reclamo con id ${id} en la API externa`)
        }
      })
    )

    revalidateReclamosList()

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}


export async function updateReclamoEstado(id: string, estado: string, notificar: boolean = true) {
  noStore();
  try {
    // El backend centraliza el envio de notificaciones al contacto.
    const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado, notificar }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Error al actualizar el estado del reclamo: ${responseText}`);
    }

    revalidateReclamosList();

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error(`Error updating estado: ${getErrorMessage(err)}`);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteTask(input: { id: string }) {
  noStore()
  try {
    const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/${input.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Error al eliminar el reclamo en la API externa")
    }

    revalidateReclamosList()

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteTasks(input: { ids: string[] }) {
  noStore()
  try {
    await Promise.all(
      input.ids.map(async (id) => {
        const response = await fetch(`${resolveInternalOrigin()}/api/core/reclamos/${id}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          throw new Error(`Error al eliminar el reclamo con id ${id}`)
        }
      })
    )

    revalidateReclamosList()

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

