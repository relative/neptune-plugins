import type { NeptuneObject } from './windowObject'

declare global {
  const neptune: NeptuneObject
  interface Window {
    neptune: typeof neptune
  }
  namespace Neptune {}
}
