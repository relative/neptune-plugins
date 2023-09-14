import plugin from './plugin'
import './react'

export function onUnload() {
  plugin.unload()
}
