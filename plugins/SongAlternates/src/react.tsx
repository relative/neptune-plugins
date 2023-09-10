import { findReactModule } from '@relative/util/hooks/react'
import { unints } from './state'

import type { ItemId } from '../../../lib/tidal'
import { actions, intercept } from '@neptune'

const React = findReactModule()
const em = React as any

interface TidalElements {
  ContextMenuAction: (
    props: Readonly<{
      action?: React.MouseEventHandler | ((arg: any) => void)
      children?: React.ReactNode
      closeOnClick?: boolean
      dataActionName?: string
      dataTest?: string
      disabled?: boolean
      enabled?: boolean
      index?: number
      leftIcon?: React.ReactNode // | 'whitespace';
      playlistUuid?: ItemId
      rightIcon?: React.ReactNode
      showSubMenu?: boolean
      title: React.ReactNode | string
    }>
  ) => JSX.Child
  ContextMenu: (props: any) => JSX.Child
  PromptItemCell: (props: {
    artist: string
    cover: string
    onClick: () => void
    playButton: boolean
    title: string
  }) => JSX.Child
}

const ele = new Proxy<TidalElements>({} as any, {
  get(t, p, r) {
    const got = Reflect.get(t, p, r)
    if (got) return got
    else return <span>component {p} has not been captured yet</span>
  },
})

function traverseElement(
  e: React.ReactElement,
  filterCb: (e: React.ReactElement) => boolean
): React.ReactElement | undefined {
  if (e.props) {
    if (Array.isArray(e.props.children)) {
      for (const i of e.props.children) {
        if (filterCb(i)) return i
        let found = traverseElement(i, filterCb)
        if (found) return found
      }
    }
  }
}

unints.push(
  (origCreateElement => {
    if (!em._createElement) em._createElement = origCreateElement

    function ContextMenuHook({ children, ...props }: any) {
      const newRet = (<ele.ContextMenu {...props} __ignore />) as any as React.ReactElement

      const yes = (
        <ele.ContextMenuAction
          title="Replace track"
          action={() => {
            const searchPhrase = props.mediaItem?.item?.title + ' ' + props.mediaItem?.item?.artist?.name

            actions.modal.showPickTrackModal({ promptId: 666, userId: 666 })
            actions.search.searchTrackForTrackPicker({
              limit: 10,
              searchPhrase,
            })

            // There is a bug in tidal code where the track picker modal tries using a non uri-encoded searchPhrase to pull search results
            actions.trackPrompts.setTrackSearchPhrase(encodeURIComponent(searchPhrase))

            const unint = intercept('trackPrompts/SET_TRACK_FOR_PROMPT', ([pl]) => {
                props.deleteFromPlaylist(props.playlistData)
                actions.content.addMediaItemsToPlaylist({
                  playlistUUID: props.playlistData.currentPlaylistUuid,
                  onDupes: 'FAIL',
                  showNotification: true,
                  addToIndex: props.index,
                  mediaItemIdsToAdd: [parseInt(pl.trn.split(':').reverse()[0])],
                })
                unintClose()
                unint()
                return false
              }),
              unintClose = intercept('modal/CLOSE', unint, true)
          }}
        ></ele.ContextMenuAction>
      )

      // @ts-expect-error
      newRet._type = newRet._type || newRet.type
      newRet.type = function (...args) {
        // @ts-expect-error shh
        const retn = newRet._type.apply(this, arguments)
        if (props.playlistData?.currentPlaylistUuid) retn.props.children[1].props.children.push(yes)
        return retn
      }
      return newRet
    }
    // function PromptItemCellHook({ children, ...props }: any) {
    //   const newRet = (<ele.PromptItemCell {...props} __ignore />) as any as React.ReactElement
    //   // @ts-expect-error shh
    //   newRet._type = newRet._type || newRet.type
    //   newRet.type = function (...args) {
    //     // @ts-expect-error shh
    //     const retn = newRet._type.apply(this, arguments)
    //     const found = traverseElement(retn, e => e.props?.wavePreset === 'bodyDemi')
    //     if (found) console.log('Found title text', found)
    //     return retn
    //   }
    //   return newRet
    // }

    ;(React as any).createElement = function (el: any, props: any, ...children: any[]) {
      if (!props?.__ignore) {
        const ts = el.toString()
        // if (ts.includes('showSecretSettings')) {
        //   ele.PlayerSettings = el
        //   el.prototype._render = el.prototype._render || el.prototype.render
        //   el.prototype.render = function (...args) {
        //     if (!this.state.showSecretSettings) this.setState({ showSecretSettings: true })
        //     return this._render.apply(this, arguments)
        //   }
        // }

        if (ts.includes(`"whitespace"===`)) ele.ContextMenuAction = el

        if (
          ts.includes('artist') &&
          ts.includes('bodyDemi') &&
          ts.includes('descriptionDemi') &&
          ts.includes('textSecondary') &&
          ts.includes('play-button')
        ) {
          ele.PromptItemCell = el
          // el = PromptItemCellHook
        }

        if (
          ts.includes('t-go-to-album') &&
          ts.includes('trackList') &&
          ts.includes('playQueue') &&
          el !== ContextMenuHook
        ) {
          ele.ContextMenu = el
          el = ContextMenuHook
        }
      }
      const retn = origCreateElement.call(this, el, props, ...children)
      return retn
    }

    return () => (React.createElement = origCreateElement)
  })(em._createElement || React.createElement)
)
