import type { NeptuneObject } from './neptune'

declare global {
  const neptune: NeptuneObject
  interface Window {
    neptune: typeof neptune
  }
  namespace Neptune {}
}
