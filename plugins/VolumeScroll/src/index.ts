import { actions, intercept, store } from '@neptune'

import { ELEMENT, VOLUME_INTERVAL, VOLUME_INTERVAL_SHIFT } from './constants'

const isVolumeButton = (i: Element) => i.nodeName === 'BUTTON' && i.getAttribute('data-test') === 'volume',
  isVolumeSlider = (i: Element) =>
    i.nodeName === 'DIV' && i.id === 'nativeRange' && i.nextElementSibling && isVolumeButton(i.nextElementSibling),
  clamp = (val: number) => Math.min(Math.max(0, val), 100)

function wheelListener(e: WheelEvent) {
  const path = (e as any).path as Array<Element>
  const hasVolumeElement = path.find(i => i && (isVolumeButton(i) || isVolumeSlider(i)))
  if (!hasVolumeElement) return

  const {
    playbackControls: { volume },
  } = store.getState()

  const volumeInterval = e.shiftKey ? VOLUME_INTERVAL_SHIFT : VOLUME_INTERVAL
  const volumeMult = e.deltaY > 0 ? -1 : 1
  const newVolume = volume + volumeInterval * volumeMult
  actions.playbackControls.setVolume({
    volume: clamp(newVolume),
  })
}

ELEMENT.addEventListener('wheel', wheelListener)

export function onUnload() {
  ELEMENT.removeEventListener('wheel', wheelListener)
}
