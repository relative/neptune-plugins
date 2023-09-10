// @ts-nocheck
import { pluginStore, reloadPlugin } from '@neptune/plugins'
if (process.env.NODE_ENV === 'development') {
  // prettier-ignore
  const { host, port, pluginName } = {dev_settings}
  const url = new URL(location.href)
  url.protocol = 'http:'
  url.host = host === '0.0.0.0' ? 'localhost' : host
  url.port = port.toString()
  url.pathname = '/esbuild'
  const pluginIdRegex = new RegExp(String.raw`${pluginName}\/?$`, 'i')
  const plugin = pluginStore.find(i => i.id.match(pluginIdRegex))
  if (plugin) {
    let eventSource = new EventSource(url)
    eventSource.addEventListener('change', e => {
      const psep = String.raw`(?:\/|\\)`
      const regexp = new RegExp(`^${psep}${pluginName}${psep}(?!manifest\.json)`, 'gi')
      try {
        const data = JSON.parse(e.data) as {
          added: string[]
          removed: string[]
          updated: string[]
        }
        for (const p of data.updated) {
          if (p.match(regexp)) {
            console.log(`[esbuild-plugin-neptune] ${pluginName} is live reloading due to changes`)
            eventSource.close()
            reloadPlugin(plugin)
            break
          }
        }
      } catch (err) {
        console.warn('Error in esbuild EventSource', err)
      }
    })
  } else {
    console.warn("Couldn't find plugin for", pluginName)
  }
}
