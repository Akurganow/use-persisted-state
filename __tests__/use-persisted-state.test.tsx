import createPersistedState from '../src';
import { renderHook } from '@testing-library/react-hooks'

const [usePersistedState, clear] = createPersistedState('test')

describe('Module: use-localstorage', () => {
    describe('useLocalStorage', () => {
        it('is callable', () => {
            const { result } = renderHook(() => usePersistedState('foo', 'bar'));

            expect(usePersistedState).toBeDefined();
            expect(clear).toBeDefined();
            expect(result.current).toBeDefined();
        });
    });
});
