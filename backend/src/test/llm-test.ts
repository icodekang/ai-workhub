/**
 * LLM + pi-mono Integration Test
 * Run with: npx ts-node src/test/llm-test.ts
 *
 * Requires: LLM provider running (e.g., Ollama `ollama serve`)
 */

import { chat, fetchEmbedding, getLLMConfig } from '../core/llm';
import { agentRegistry } from '../agents';

async function main() {
  console.log('=== AI-WorkHub LLM Integration Test ===\n');

  // 1. Load and display config
  const config = getLLMConfig();
  console.log(`Provider: ${config.provider}`);
  console.log(`URL: ${config.url}`);
  console.log(`Chat Model: ${config.chatModel}`);
  console.log(`Embedding Model: ${config.embeddingModel}`);
  console.log(`Stop Words: ${config.stopWords.join(', ') || '(none)'}`);
  console.log();

  // 2. Register an agent
  const agent = agentRegistry.registerAgent({
    id: 'test-agent-001',
    employeeId: 'emp-001',
    name: 'Alice',
    identity: '我是Alice，后端工程师，擅长Node.js和TypeScript。',
    plan: '测试pi-mono集成是否正常工作。',
    model: config.chatModel,
    temperature: 0.7,
  });
  console.log(`Registered agent: ${agent.id} (total: ${agentRegistry.count})\n`);

  // 3. Test chat
  console.log('--- Testing chatCompletion ---');
  try {
    const response = await agent.chat([
      { role: 'user', content: '你好，请简单介绍一下你自己。' },
    ]);
    console.log(`Agent: ${response}\n`);
  } catch (err) {
    console.error('Chat error:', err);
  }

  // 4. Test embedding
  console.log('--- Testing fetchEmbedding ---');
  try {
    const { embedding, usage } = await fetchEmbedding('Hello, world!');
    console.log(`Embedding dimension: ${embedding.length}`);
    console.log(`Token usage: ${usage ?? 'N/A'}\n`);
  } catch (err) {
    console.error('Embedding error:', err);
  }

  // 5. Test simple chat helper
  console.log('--- Testing chat() helper ---');
  try {
    const reply = await chat(
      [
        { role: 'user', content: 'Say "works!" in one word.' },
      ],
      { model: config.chatModel, temperature: 0.1 },
    );
    console.log(`Reply: ${reply}\n`);
  } catch (err) {
    console.error('chat() helper error:', err);
  }

  // 6. List agents
  console.log('--- Registered agents ---');
  for (const a of agentRegistry.list()) {
    console.log(` - ${a.id} | ${a.identity.slice(0, 40)}...`);
  }

  console.log('\n=== Test complete ===');
}

main().catch(console.error);
