/**
 * Sanity tests - Phase 0
 * Verifies basic project setup and infrastructure
 */

describe('Project Sanity', () => {
  it('should have working test infrastructure', () => {
    expect(true).toBe(true);
  });

  it('should be able to do basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have proper TypeScript support', () => {
    const greet = (name: string): string => `Hello, ${name}!`;
    expect(greet('Summit Wheels')).toBe('Hello, Summit Wheels!');
  });

  it('should support async/await', async () => {
    const asyncFn = async (): Promise<number> => {
      return Promise.resolve(42);
    };
    const result = await asyncFn();
    expect(result).toBe(42);
  });
});

describe('Environment', () => {
  it('should have Jest configured correctly', () => {
    expect(typeof jest).toBe('object');
    expect(typeof expect).toBe('function');
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
  });
});
