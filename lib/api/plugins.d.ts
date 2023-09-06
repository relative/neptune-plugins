import type { store } from 'voby'
import type { createPersistentObject } from './utils'

export const [pluginStore, pluginStoreReady]: ReturnType<typeof createPersistentObject>

export const enabled: ReturnType<typeof store>

export interface PluginManifest {
  name: string
  author: string
  description: string
  hash: string
}

export interface Plugin {
  id: string
  code: string
  manifest: PluginManifest
  enabled: boolean
  update: boolean
}

export function getPluginById(id: Plugin['id']): Plugin | undefined
export async function disablePlugin(id: Plugin['id']): Promise<void>
export function togglePlugin(id: Plugin['id']): ReturnType<typeof disablePlugin> | ReturnType<typeof enablePlugin>
export async function enablePlugin(id: Plugin['id']): Promise<void>
export async function installPlugin(
  id: Plugin['id'],
  code: Plugin['code'],
  manifest: PluginManifest,
  enabled = true
): Promise<void>
export async function removePlugin(id: Plugin['id']): Promise<void>
export async function fetchPluginFromURL(url: string): Promise<[code: string, manifest: PluginManifest]>
export async function reloadPlugin(plugin: Plugin): Promise<void>
export async function installPluginFromURL(
  url: Parameterss<typeof fetchPluginFromURL>[0],
  enabled = true
): Promise<void>
