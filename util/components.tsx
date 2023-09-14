import type { ContextMenuLocationContextType, ItemId, MediaItem, SortDirection, SortOrder } from 'neptune-types/tidal'
import React from './modules/react'
import { savedWin } from './savedWin'

interface TidalElements {
  ContextMenuAction: (
    props: Readonly<{
      action?: React.MouseEventHandler | ((arg: any) => void)
      children?: React.ReactNode
      closeOnClick?: boolean
      dataActionName?: string
      dataTest?: string
      disabled?: boolean
      enabled?: boolean
      index?: number
      leftIcon?: React.ReactNode // | 'whitespace';
      playlistUuid?: ItemId
      rightIcon?: React.ReactNode
      showSubMenu?: boolean
      title: React.ReactNode | string
    }>
  ) => JSX.Child
  ContextMenu: (props: {
    isUserPlaylist?: boolean
    contextMenuLocation?: ContextMenuLocationContextType
    playlistData?: {
      currentDirection: SortDirection
      currentOrder: SortOrder
      currentPlaylistUuid?: ItemId
      mediaItemId?: ItemId
    }
    mediaItem?: MediaItem
    index: number
    sourceContext: any
  }) => JSX.Child
  PromptItemCell: (props: {
    artist: string
    cover: string
    onClick: () => void
    playButton: boolean
    title: string
  }) => JSX.Child
}

const sym = savedWin.wc.sym || (savedWin.wc.sym = Symbol('Wrapped Component'))
export const symName = savedWin.wc.symName || (savedWin.wc.symName = Symbol('Wrapped Component Name'))
export const Observers =
  savedWin.wc.Observers ||
  (savedWin.wc.Observers = new Set<(name: string, val: (props: any) => JSX.Child) => boolean>())

export const setComponent = (name: keyof typeof Components, el: CallableFunction) => {
  if (Components[name] && !isWrappedComponent(Components[name])) return
  Components[name] = el as any
  // console.log('Set component', name, 'to', el)
  for (const obs of Observers) {
    if (obs(name, el as any)) {
      // console.log('Deleting observer @ size', Observers.size)
      Observers.delete(obs)
    }
  }
}

export const WrappedComponent = (componentName: keyof TidalElements) => {
    const fn = (props: any) => {
      const [RC, setRc] = React.useState<((props: any) => JSX.Child) | undefined>((c = Components[componentName]) =>
        isWrappedComponent(c) ? undefined : c
      )
      const callback = React.useCallback((name: string, val: (props: any) => JSX.Child) => {
        if (name !== componentName) return false
        setRc(val)
        return true
      }, [])

      if (!RC) {
        Observers.add(callback)
        // console.log('Added observer new size', Observers.size)
        return (
          <span>
            Component <code>{componentName}</code> has not been captured yet
          </span>
        )
      } else {
        return <RC {...props} />
      }
    }
    ;((fn as any)[sym] = true), ((fn as any)[symName] = componentName)
    return fn
  },
  isWrappedComponent = (e: any): e is ReturnType<typeof WrappedComponent> => e[sym] === true

export const Components = new Proxy<TidalElements>({} as TidalElements, {
  get(t, p, r) {
    const got = Reflect.get(t, p, r)
    if (got) return got
    else if (typeof p === 'string') return ((t as any)[p] = WrappedComponent(p as any))
    else return got
  },
})
