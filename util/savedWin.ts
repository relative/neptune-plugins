import type { HookComponent, HookedReactFn } from './hooks/react'

interface RUSavedWin {
  wc: {
    sym: symbol
    symName: symbol
    Observers: Set<(name: string, val: (props: any) => JSX.Child) => boolean>
    Hooks: Map<
      CallableFunction,
      {
        fixed: boolean
        hooks: Array<HookedReactFn>
        HookEl: ReturnType<typeof HookComponent<any>>
      }
    >
  }
}
export const savedWin: RUSavedWin =
  (window as any).__npruSw ||
  ((window as any).__npruSw = {
    wc: {},
  })
