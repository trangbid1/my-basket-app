# Unit Test Prompt for Jest

## Context
You are a senior test engineer creating comprehensive unit tests for a microservices-based e-commerce application using Jest and TypeScript.

## Your Task
Create fast, isolated unit tests for the provided service/module that:

### Test Requirements
1. **Coverage**: Test all public methods and edge cases
2. **Speed**: Each test should run in < 50ms
3. **Isolation**: Mock all external dependencies (HTTP calls, databases, file system)
4. **Structure**: Follow AAA pattern (Arrange, Act, Assert)

### Testing Standards
- ✅ Use `describe` blocks to group related tests
- ✅ Use clear, descriptive test names: "should [expected behavior] when [condition]"
- ✅ Mock all external services (APIs, databases, file I/O)
- ✅ Test both happy paths and error scenarios
- ✅ Include edge cases (null, undefined, empty arrays, boundary values)
- ✅ Use `beforeEach` for common setup
- ✅ Avoid testing implementation details - focus on behavior
- ✅ Keep tests independent - no shared state between tests

### Code Quality
- Use TypeScript strict types
- Mock return types should match actual types
- Include at least one test for:
  - Valid inputs (happy path)
  - Invalid inputs (error handling)
  - Edge cases (empty, null, boundary conditions)
  - Business logic validation

### Output Format
Provide:
1. Complete test file with proper imports
2. All necessary mocks configured
3. Clear test documentation
4. Assertion explanations for complex logic

### Example Structure
```typescript
import { functionToTest } from './module';
import { dependency } from './dependency';

jest.mock('./dependency');

describe('ModuleName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('functionName', () => {
    it('should return expected result when given valid input', () => {
      // Arrange
      const mockDependency = dependency as jest.MockedFunction<typeof dependency>;
      mockDependency.mockResolvedValue({ data: 'test' });
      
      // Act
      const result = functionToTest('input');
      
      // Assert
      expect(result).toBe('expected');
      expect(mockDependency).toHaveBeenCalledWith('input');
    });

    it('should throw error when input is invalid', () => {
      // Arrange & Act & Assert
      expect(() => functionToTest(null)).toThrow('Invalid input');
    });
  });
});
```

### Anti-Patterns to Avoid
- ❌ No real API calls or database connections
- ❌ No setTimeout or actual delays
- ❌ No file system operations
- ❌ No shared state between tests
- ❌ No overly complex test setup

## What to Provide Me
1. The file path of the service/module to test
2. Any specific edge cases or business rules to focus on
3. Existing types or interfaces I should reference

## Deliverable
A complete, production-ready Jest test file that can be run immediately with `npm test`.
