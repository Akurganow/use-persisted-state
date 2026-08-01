import createStorage from '../utils/create-web-storage'

// The typeof guard keeps this import from throwing on server runtimes, where the global is not defined.
export default createStorage(typeof localStorage !== 'undefined' ? localStorage : undefined)
