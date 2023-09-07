import type * as patcher from 'spitroast'
import type * as voby from 'voby'
import type * as utils from './api/utils'
import type * as plugins from './api/plugins'
import type * as components from './ui/components'
import type { hookContextMenu } from './api/hookContextMenu'
import type { intercept } from './api/intercept'
import type { observe } from './api/observe'
import type { registerRoute } from './api/registerRoute'
import type { registerTab } from './api/registerTab'
import type { showModal } from './api/showModal'
import type { Store } from 'redux'

const store: Store

export interface NeptuneObject {
  patcher: typeof patcher
  utils: typeof utils
  hookContextMenu: typeof hookContextMenu
  intercept: typeof intercept
  observe: typeof observe
  registerRoute: typeof registerRoute
  registerTab: typeof registerTab
  showModal: typeof showModal
  voby: typeof voby
  plugins: typeof plugins
  components: typeof components
  store: typeof store
}
export {
  patcher,
  utils,
  hookContextMenu,
  intercept,
  observe,
  registerRoute,
  registerTab,
  showModal,
  voby,
  plugins,
  components,
  store,
}
