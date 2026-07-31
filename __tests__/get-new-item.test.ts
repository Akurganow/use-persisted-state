/* eslint-disable @typescript-eslint/ban-ts-comment */
import getNewItem from '../src/utils/get-new-item'

describe('get-new-item', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    // @ts-expect-error
    console.error.mockRestore()
  })

  afterEach(() => {
    // @ts-expect-error
    console.error.mockClear()
  })

  it('should return stringified object', () => {
    expect(getNewItem<string>('key', '{"foo": "bar"}', 'baz')).toEqual(
      JSON.stringify({
        foo: 'bar',
        key: 'baz',
      }),
    )
  })

  it('should console.error if not valid persistedItem', () => {
    expect(getNewItem<string>('key', 'foo: bar', 'baz')).toEqual(
      JSON.stringify({
        key: 'baz',
      }),
    )

    expect(console.error).toHaveBeenCalled()
  })
})
