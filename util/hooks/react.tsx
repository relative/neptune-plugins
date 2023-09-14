import type { RUPlugin } from '../plugin'
import { Observers, isWrappedComponent, setComponent, symName } from '../components'
import React from '../modules/react'
import { savedWin } from '~/savedWin'

export type HookedReactFn<T = any> = (
  props: T,
  nr: React.ReactElement<any, React.JSXElementConstructor<any>>
) => true | void

const Hooks =
  savedWin.wc.Hooks ||
  (savedWin.wc.Hooks = new Map<
    CallableFunction,
    {
      fixed: boolean
      hooks: Array<HookedReactFn>
      HookEl: ReturnType<typeof HookComponent<any>>
    }
  >())

export function HookComponent<T extends object>(Orig: (props: T) => JSX.Child) {
  return (props: T) => {
    const newRet = <Orig {...props} __ignore />

    // @ts-expect-error
    newRet._type = newRet._type || newRet.type
    // @ts-expect-error
    newRet.type = function (...args) {
      // @ts-expect-error shh
      const retn = newRet._type.apply(this, arguments)
      const hookObj = Hooks.get(Orig)
      if (hookObj?.hooks.length) {
        for (const hk of hookObj.hooks) {
          hk(props, retn)
        }
      }
      return retn
    }
    return newRet
  }
}

export function hookComponent<T extends object>(this: RUPlugin, orig: (props: T) => any, wrap: HookedReactFn<T>) {
  const hooks: Array<HookedReactFn> = Hooks.get(orig)?.hooks ?? []
  if (!Hooks.has(orig)) Hooks.set(orig, { fixed: false, hooks, HookEl: HookComponent(orig) })
  hooks.push(wrap)

  if (isWrappedComponent(orig)) {
    const ne = Hooks.get(orig)
    if (ne && !ne.fixed) {
      const originalName = (orig as any)[symName]
      Observers.add((name, val) => {
        if (name !== originalName) return false
        const ne = Hooks.get(orig)!
        ne.HookEl = HookComponent(val)
        Hooks.set(val, ne).delete(orig)
        return true
      })
      ne.fixed = true
    }
  }
  this.on('unload', () => {
    const idx = hooks.indexOf(wrap)
    if (idx < 0) return
    hooks.splice(idx, 1)
  })
}

function captureElement(el: CallableFunction, props: any, ...children: any[]) {
  const ts = el.toString()
  // if (ts.includes('showSecretSettings')) {
  //   ele.PlayerSettings = el
  //   el.prototype._render = el.prototype._render || el.prototype.render
  //   el.prototype.render = function (...args) {
  //     if (!this.state.showSecretSettings) this.setState({ showSecretSettings: true })
  //     return this._render.apply(this, arguments)
  //   }
  // }

  if (ts.includes(`"whitespace"===`)) {
    setComponent('ContextMenuAction', el)
  }

  if (
    ts.includes('artist') &&
    ts.includes('bodyDemi') &&
    ts.includes('descriptionDemi') &&
    ts.includes('textSecondary') &&
    ts.includes('play-button')
  ) {
    setComponent('PromptItemCell', el)
    // el = PromptItemCellHook
  }

  if (ts.includes('t-go-to-album') && ts.includes('trackList') && ts.includes('playQueue')) {
    setComponent('ContextMenu', el)
    // el = ContextMenuHook
  }
}

function hookReactCreateElement(origCreateElement: typeof React.createElement) {
  if (!React._createElement) React._createElement = origCreateElement
  ;(React as any).createElement = function (el: any, props: any, ...children: any[]) {
    if (typeof el === 'function') {
      if (!props?.__ignore) {
        captureElement(el, props, ...children)
        const set = Hooks.get(el)
        if (set?.HookEl) {
          el = set?.HookEl
        }
      }
    }

    const retn = origCreateElement.call(this, el, props, ...children)
    return retn
  }
}

// main
hookReactCreateElement(React._createElement ?? React.createElement)
