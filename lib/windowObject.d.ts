import type * as patcher from 'spitroast'
import type * as voby from 'voby'
import type * as utils from './api/utils'
import type * as plugins from './api/plugins'
import type * as components from './ui/components'
import type { hookContextMenu } from './api/hookContextMenu'
import { intercept } from './api/intercept'
import { observe } from './api/observe'
import { registerRoute } from './api/registerRoute'
import { registerTab } from './api/registerTab'
import { showModal } from './api/showModal'
import { Store } from 'redux'
import { NeptuneDispatchers } from './tidal/index'
const store: Store

const actions: NeptuneDispatchers
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
  actions: NeptuneDispatchers
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
  actions,
}
