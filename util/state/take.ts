import type { ActionTypes } from 'neptune-types/tidal'
import { promiseTimeout } from '../util'
import { intercept } from '@neptune'

// https://github.com/microsoft/TypeScript/issues/27808

export type Action<AT extends keyof ActionTypes = keyof ActionTypes> = {
  type: AT
  payload: ActionTypes[AT]
}

export function isActionType<PossibleTypes extends keyof ActionTypes, AT extends PossibleTypes>(
  action: Action<PossibleTypes>,
  type: AT
): action is Action<AT> {
  return action.type === type
}
export function assertActionType<PossibleTypes extends keyof ActionTypes, AT extends PossibleTypes>(
  action: Action<PossibleTypes>,
  type: AT
): asserts action is Action<AT> {
  if (!isActionType(action, type)) throw new Error(`Action of type "${action.type}" is not "${type}"`)
}

export function take<AT extends keyof ActionTypes, LAT extends AT[] = AT[]>(
  actionTypes: AT[],
  timeoutMs?: number,
  listOfTypesToCancel?: LAT
): Promise<Action<AT>>
export function take<AT extends keyof ActionTypes>(
  actionTypes: AT[],
  timeoutMs?: number,
  shouldCancel?: boolean
): Promise<Action<AT>>
export function take<AT extends keyof ActionTypes>(
  actionTypes: AT[],
  timeoutMs?: number,
  shouldCancel?: (t: Action<AT>) => boolean
): Promise<Action<AT>>
export function take<AT extends keyof ActionTypes>(
  actionTypes: AT[],
  timeoutMs = 5000,
  shouldCancel?: boolean | AT[] | ((t: Action<AT>) => boolean)
): Promise<Action<AT>> {
  const cleanupFns = new Set<() => void>()
  return promiseTimeout<Action<AT>>(
    (resolve, reject) => {
      for (const type of actionTypes) {
        cleanupFns.add(
          intercept(type, ([pl]) => {
            const o = { type, payload: pl }
            let sc = false
            if (typeof shouldCancel !== 'undefined') {
              if (typeof shouldCancel === 'boolean') sc = shouldCancel
              else if (Array.isArray(shouldCancel)) sc = shouldCancel.includes(o.type)
              else sc = shouldCancel(o)
            }
            resolve(o)
            if (sc === true) return true
          })
        )
      }
    },
    timeoutMs,
    () => {
      cleanupFns.forEach(c => c())
      cleanupFns.clear()
    }
  )
}
