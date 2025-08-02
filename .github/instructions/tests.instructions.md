---
applyTo: "__tests__/**/*.ts"
---

# Test-Specific Instructions

## Jest Testing Standards
- Prefer **small, isolated Jest tests** that focus on single units of functionality
- Use descriptive test names that clearly explain what behavior is being verified
- Group related tests using `describe` blocks with clear context

## Storage Mocking
- **Mock storage/adapters** - avoid real browser storage in unit tests
- Use `jest-localstorage-mock` for localStorage/sessionStorage testing
- Use `jest-webextension-mock` for browser extension storage testing
- Create predictable test data that doesn't depend on external state

## Test Structure & Assertions
- **Keep assertions focused** - each test should verify one specific behavior
- **Cover edge cases** for key helpers, especially storage operations and type handling
- Test error conditions (invalid data, storage failures, etc.)
- Verify cleanup of event listeners and side effects

## React Testing Library Integration
- Use `@testing-library/react` for component testing
- Test hooks using `renderHook` from React Testing Library
- Avoid implementation details - test behavior, not internal state
- Use `act` wrapper for state updates and async operations

## Test Data & Setup
- Use consistent test data patterns across similar tests
- Clean up after tests to prevent test pollution
- Mock external dependencies consistently
- Test both sync and async storage scenarios where applicable