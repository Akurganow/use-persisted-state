/* eslint-disable @typescript-eslint/ban-ts-comment */
import getNewItem from '../src/utils/get-new-item'

describe('get-new-item', function () {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    // @ts-ignore
    console.error.mockRestore()
  })

  afterEach(() => {
    // @ts-ignore
    console.error.mockClear()
  })

  it('should return stringified object', function () {
    expect(getNewItem<string>('key', '{"foo": "bar"}', 'baz'))
      .toEqual(JSON.stringify({
        foo: 'bar',
        key: 'baz',
      }))
  })

  it('should console.error if not valid persistedItem', function () {
    expect(getNewItem<string>('key', 'foo: bar', 'baz'))
      .toEqual(JSON.stringify({
        key: 'baz',
      }))

    expect(console.error).toHaveBeenCalled()
  })
})
