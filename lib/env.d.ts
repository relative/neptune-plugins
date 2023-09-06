import type { NeptuneObject } from './windowObject'

declare global {
  declare const neptune: NeptuneObject
  interface Window {
    neptune: typeof neptune
  }
}
