import { expect } from 'chai';
import { generateGreeting, GreetingOptions } from '../scripts/hello-world';

describe('Hello World Script', () => {
  describe('generateGreeting', () => {
    it('should generate a basic greeting with default options', () => {
      const greeting = generateGreeting();
      expect(greeting).to.match(/^Hello, World!/);
    });

    it('should generate a personalized greeting', () => {
      const greeting = generateGreeting({ name: 'Alice' });
      expect(greeting).to.match(/^Hello, Alice!/);
    });

    it('should support different languages', () => {
      const spanishGreeting = generateGreeting({ language: 'es' });
      expect(spanishGreeting).to.match(/^Hola, World!/);

      const frenchGreeting = generateGreeting({ language: 'fr' });
      expect(frenchGreeting).to.match(/^Bonjour, World!/);

      const germanGreeting = generateGreeting({ language: 'de' });
      expect(germanGreeting).to.match(/^Hallo, World!/);
    });

    it('should support disabling emojis', () => {
      const greeting = generateGreeting({ emoji: false });
      expect(greeting).to.equal('Hello, World!');
    });

    it('should combine all options correctly', () => {
      const greeting = generateGreeting({
        name: 'Test User',
        language: 'es',
        emoji: false,
      });
      expect(greeting).to.equal('Hola, Test User!');
    });

    it('should include emojis when enabled', () => {
      const greeting = generateGreeting({ emoji: true });
      // Should contain at least one emoji character
      expect(greeting).to.match(/[👋🌍✨🎉]/);
    });
  });
});