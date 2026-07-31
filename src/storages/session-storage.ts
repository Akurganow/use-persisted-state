import createStorage from '../utils/create-web-storage'

// The typeof guard keeps this import from throwing on server runtimes (SSR),
// where the browser storage globals are not defined.
export default createStorage(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined)
