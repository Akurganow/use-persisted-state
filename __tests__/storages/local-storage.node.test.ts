/**
 * @jest-environment node
 *
 * SSR check. A jsdom test cannot prove anything here: under jsdom the browser
 * globals exist, so the import would be green by construction. This has to run
 * without a DOM (see .agents/rules/testing.md).
 */
describe('local-storage adapter under Node (SSR)', () => {
  test('can be imported without a DOM', () => {
    // jest-localstorage-mock (setupFilesAfterEach) defines storage globals even
    // in the node environment; a real server runtime has none of them.
    delete (globalThis as { localStorage?: unknown }).localStorage
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage

    expect(() => {
      jest.requireActual('../../src/storages/local-storage')
    }).not.toThrow()
  })
})
