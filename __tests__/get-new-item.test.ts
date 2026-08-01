import getNewItem from '../src/utils/get-new-item'

describe('get-new-item', () => {
  test('serializes a value into an absent entry', () => {
    expect(getNewItem('key', undefined, 'value')).toBe('{"key":"value"}')
  })

  test('merges a value into an existing entry without losing sibling keys', () => {
    expect(getNewItem('key', '{"alpha":"one","key":"old"}', 'new')).toBe('{"alpha":"one","key":"new"}')
  })

  // A sibling hook's `__proto__` value belongs to whoever stored it and must survive
  // an unrelated write. Copying the entry by assignment instead of spread drops it.
  test('keeps a sibling __proto__ key through a merge', () => {
    expect(getNewItem('alpha', '{"__proto__":"kept","alpha":"one"}', 'two')).toBe('{"__proto__":"kept","alpha":"two"}')
  })
})
