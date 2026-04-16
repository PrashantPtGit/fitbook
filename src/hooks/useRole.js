import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'

export function useRole() {
  return useGymStore(
    useShallow((s) => ({
      userRole:    s.userRole,
      userGymId:   s.userGymId,
      userName:    s.userName,
      roleLoading: s.roleLoading,
    }))
  )
}

export const isMainAdmin = (role) => role === 'main_admin'
export const isCoOwner   = (role) => role === 'co_owner'
