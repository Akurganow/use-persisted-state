import React from 'react'
import isFunction from './is-function'

export default function <T>(newState: React.SetStateAction<T>, state: T): T {
  let newValue: T

  if (isFunction(newState)) {
    newValue = newState(state)
  } else {
    newValue = newState
  }

  return newValue
}
