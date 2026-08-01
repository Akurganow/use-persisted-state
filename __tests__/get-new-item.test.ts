import getNewItem from '../src/utils/get-new-item'

describe('get-new-item', () => {
  test('serializes a value into an absent entry', () => {
    expect(getNewItem('key', undefined, 'value')).toBe('{"key":"value"}')
  })

  test('merges a value into an existing entry without losing sibling keys', () => {
    expect(getNewItem('key', '{"alpha":"one","key":"old"}', 'new')).toBe('{"alpha":"one","key":"new"}')
  })
})
