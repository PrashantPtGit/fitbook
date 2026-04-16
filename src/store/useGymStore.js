import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

export const useGymStore = create((set) => ({
  // GYMS SLICE
  gyms: [],
  activeGymId: null,
  activeGym: null,
  setGyms: (gyms) => set({ gyms }),
  setActiveGym: (gymId) =>
    set((state) => ({
      activeGymId: gymId,
      activeGym: gymId ? state.gyms.find((g) => g.id === gymId) : null,
    })),

  // MEMBERS SLICE
  members: [],
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({ members: [member, ...state.members] })),
  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  // PAYMENTS SLICE
  payments: [],
  setPayments: (payments) => set({ payments }),
  addPayment: (payment) =>
    set((state) => ({ payments: [payment, ...state.payments] })),

  // ATTENDANCE SLICE
  attendance: [],
  setAttendance: (attendance) => set({ attendance }),
  addAttendance: (record) =>
    set((state) => ({ attendance: [record, ...state.attendance] })),

  // SETTINGS SLICE
  settings: {},
  setSettings: (settings) => set({ settings }),

  // ROLE SLICE
  userRole:    null,   // 'main_admin' | 'co_owner' | 'member'
  userGymId:   null,   // locked gym for co_owner
  userName:    null,   // display name from user_roles table
  roleLoading: true,
  setUserRole: (role, gymId, name) =>
    set({ userRole: role, userGymId: gymId, userName: name, roleLoading: false }),

  // UI SLICE
  loading: false,
  setLoading: (loading) => set({ loading }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Full reset on logout
  resetStore: () => set({
    gyms: [], activeGymId: null, activeGym: null,
    members: [], payments: [], attendance: [], settings: {},
    userRole: null, userGymId: null, userName: null, roleLoading: true,
  }),
}))

export const useActiveGym = () =>
  useGymStore(
    useShallow((s) => ({
      activeGymId: s.activeGymId,
      activeGym: s.activeGym,
      gyms: s.gyms,
      setActiveGym: s.setActiveGym,
    }))
  )

export const useMembers = () => useGymStore((s) => s.members)
export const useLoading = () => useGymStore((s) => s.loading)
