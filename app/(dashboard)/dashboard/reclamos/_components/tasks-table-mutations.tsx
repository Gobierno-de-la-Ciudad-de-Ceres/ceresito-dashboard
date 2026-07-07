"use client"

import * as React from "react"

type RemoveTasksFromTable = (ids: string[]) => void

const TasksTableMutationsContext =
  React.createContext<RemoveTasksFromTable | null>(null)

export function TasksTableMutationsProvider({
  children,
  onRemoveTasks,
}: {
  children: React.ReactNode
  onRemoveTasks: RemoveTasksFromTable
}) {
  return (
    <TasksTableMutationsContext.Provider value={onRemoveTasks}>
      {children}
    </TasksTableMutationsContext.Provider>
  )
}

export function useRemoveTasksFromTable() {
  return React.useContext(TasksTableMutationsContext)
}
