export default function<T>(key: string, persistedItem: string, newValue: T): string {
  let persist: { [x: string]: unknown }

  try {
    persist = persistedItem ? JSON.parse(persistedItem) : {}
  } catch (err) {
    console.error(err)
    persist = {}
  }

  return JSON.stringify(
    Object.assign(persist, {
      [key]: newValue,
    }),
  )
}
