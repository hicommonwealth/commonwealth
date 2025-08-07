#!/usr/bin/env node

/**
 * A simple hello world script for testing purposes.
 * This script demonstrates basic TypeScript functionality and can be used
 * as a template for other utility scripts.
 */

interface GreetingOptions {
  name?: string;
  language?: 'en' | 'es' | 'fr' | 'de';
  emoji?: boolean;
}

const greetings = {
  en: 'Hello',
  es: 'Hola',
  fr: 'Bonjour',
  de: 'Hallo',
};

const emojis = ['👋', '🌍', '✨', '🎉'];

function generateGreeting(options: GreetingOptions = {}): string {
  const { name = 'World', language = 'en', emoji = true } = options;
  
  const greeting = greetings[language];
  const emojiStr = emoji ? ` ${emojis[Math.floor(Math.random() * emojis.length)]}` : '';
  
  return `${greeting}, ${name}!${emojiStr}`;
}

function main(): void {
  console.log('='.repeat(50));
  console.log('🚀 Commonwealth Hello World Test Script');
  console.log('='.repeat(50));
  
  // Basic greeting
  console.log(generateGreeting());
  
  // Personalized greetings
  console.log(generateGreeting({ name: 'Commonwealth Team' }));
  console.log(generateGreeting({ name: 'Developer', language: 'es' }));
  console.log(generateGreeting({ name: 'Contributor', language: 'fr', emoji: false }));
  
  // Current timestamp
  console.log(`\n📅 Script executed at: ${new Date().toISOString()}`);
  
  // Process info
  console.log(`🏃 Running on Node.js ${process.version}`);
  console.log(`📂 Current working directory: ${process.cwd()}`);
  
  console.log('\n✅ Hello World script completed successfully!');
}

// Export for potential testing
export { generateGreeting, GreetingOptions };

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}