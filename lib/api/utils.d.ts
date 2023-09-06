import type { UseStore } from 'idb-keyval'

interface StyleFn {
  /**
   * Removes <style> from document
   */
  (): HTMLStyleElement

  /**
   * Updates CSS in <style> element
   */
  (style: HTMLStyleElement['innerHTML']): void
}

export function appendStyle(style: HTMLStyleElement['innerHTML']): void
export const neptuneIdbStore: UseStore
export function createPersistentObject<T = unknown>(id, isArray = false): [T, Promise<void>]
export function createPersistentObject<T = unknown>(id, isArray = true): [T[], Promise<void>]
export function getMediaURLFromID<TPath extends string = path>(
  id,
  path = '/1280x1280.jpg'
): `https://resources.tidal.com/images/${string}${TPath}`
