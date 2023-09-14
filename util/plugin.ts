import { hookComponent } from './hooks/react'

interface ValidEventTypes {
  [x: string | symbol | number]: [...any]
}

type ListenerFn<This, Args extends [...any] = any[]> = (this: This, ...args: Args) => any
interface EventListener<T extends ValidEventTypes> {
  listeners: Map<keyof T, Set<ListenerFn<this>>>
  on<X extends keyof T>(event: X, listener: ListenerFn<this, T[X]>): this
  emit<X extends keyof T>(event: X, ...args: T[X]): Promise<any>
  removeListener<X extends keyof T>(event: X, listener: ListenerFn<this, T[X]>): this
}

export interface RUPlugin
  extends EventListener<{
    unload: [void]
  }> {
  id: string

  unload(): void
  hookComponent: typeof hookComponent
}
export const Registry = new Map<string, RUPlugin>()

function unload(this: RUPlugin) {
  if (!Registry.has(this.id)) throw new Error('RUPlugin does not exist')
  Registry.delete(this.id)
}

export async function createPlugin(): Promise<RUPlugin> {
  const plugin: RUPlugin = {
    id: crypto.randomUUID(),
    unload,
    hookComponent,

    listeners: new Map(),
    on(event, listener) {
      const set = this.listeners.get(event) ?? new Set<ListenerFn<RUPlugin>>()
      if (!this.listeners.has(event)) this.listeners.set(event, set)
      // @ts-expect-error its ok shh
      set.add(listener)
      return this
    },
    async emit(event, ...args) {
      const set = this.listeners.get(event)
      if (!set) return Promise.resolve()
      return Promise.all([...set].map(fn => fn.apply(this, args)))
    },
    removeListener(event, listener) {
      // @ts-expect-error shh
      this.listeners.get(event)?.delete(listener)
      return this
    },
  }
  Registry.set(plugin.id, plugin)
  return plugin
}
