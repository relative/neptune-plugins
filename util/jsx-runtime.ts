import React from './modules/react'

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/react/blob/main/packages/react/src/jsx/ReactJSXElement.js
 */

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
  children: true,
}

const { hasOwnProperty } = Object.prototype

export function jsx(type: any, config: any, maybeKey?: string) {
  let key: string | null = null
  let ref: any = null
  let children: any = null

  let props: any = {}

  if (maybeKey !== undefined) key = '' + maybeKey
  if (config.key !== undefined) key = '' + config.key
  if (config.ref !== undefined) ref = config.ref
  if (config.children !== undefined) children = config.children

  for (const propName in config)
    if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName))
      props[propName] = config[propName]

  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps
    for (const propName in defaultProps) if (props[propName] === undefined) props[propName] = defaultProps[propName]
  }

  return React.createElement(type, props, children)
}
export const jsxs = jsx
export const Fragment = React.Fragment
