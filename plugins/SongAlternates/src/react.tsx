import { actions } from '@neptune'

import { isActionType, take } from '@relative/util/state/take'

import { Components } from '@relative/util'
import plugin from './plugin'

plugin.hookComponent(Components.ContextMenu, (props, retn) => {
  if (props.isUserPlaylist && props.contextMenuLocation === 'trackList' && props.playlistData?.currentPlaylistUuid) {
    retn.props.children[1].props.children.push(
      <Components.ContextMenuAction
        title="Replace track"
        action={async () => {
          const searchPhrase = props.mediaItem?.item?.title + ' ' + props.mediaItem?.item?.artist?.name

          actions.modal.showPickTrackModal({ promptId: 666, userId: 666 })
          actions.trackPrompts.setTrackSearchPhrase(searchPhrase)

          const ret = await take(['trackPrompts/SET_TRACK_FOR_PROMPT', 'modal/CLOSE'], 0, [
            'trackPrompts/SET_TRACK_FOR_PROMPT',
          ])
          if (isActionType(ret, 'trackPrompts/SET_TRACK_FOR_PROMPT')) {
            const playlistUUID = props.playlistData?.currentPlaylistUuid!,
              currentOrder = props.playlistData?.currentOrder ?? 'INDEX',
              currentDirection = props.playlistData?.currentDirection ?? 'ASC',
              mediaItemId = props.playlistData?.mediaItemId

            actions.content.addMediaItemsToPlaylist({
              playlistUUID,
              onDupes: 'ADD',
              showNotification: true,
              addToIndex: props.index,
              mediaItemIdsToAdd: [parseInt(ret.payload.trn.split(':').reverse()[0])],
            })

            const addRet = await take([
              'content/ADD_MEDIA_ITEMS_TO_PLAYLIST_FAIL',
              'content/ADD_MEDIA_ITEMS_TO_PLAYLIST_SUCCESS',
            ])
            if (isActionType(addRet, 'content/ADD_MEDIA_ITEMS_TO_PLAYLIST_SUCCESS')) {
              actions.content.removeMediaItemsFromPlaylist({
                currentDirection,
                currentOrder,
                mediaItemId,
                playlistUUID,
                removeIndices: [props.index + 1], // +1 since we added the selected track
                moduleId: null,
              })
            } else if (isActionType(addRet, 'content/ADD_MEDIA_ITEMS_TO_PLAYLIST_FAIL')) {
              // Failed to add playlist item
              // Tidal should have displayed a notification
            }
          } else if (isActionType(ret, 'modal/CLOSE')) {
            // Modal was closed, no further action required
          }
        }}
      />
    )
  }
})
