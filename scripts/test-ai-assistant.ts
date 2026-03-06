#!/usr/bin/env tsx

/**
 * AI Assistant Test Script
 * Tests the AI assistant functionality with various property management scenarios
 */

import { AIService } from '../lib/services/aiService';

async function testAIAssistant() {
  console.log('🤖 Testing RentMatic AI Assistant...\n');

  // Test 1: Basic greeting and question answering
  console.log('📝 Test 1: Basic Question Answering');
  try {
    const response1 = await AIService.sendMessage('Hello, how can you help me?');
    console.log('✅ Response:', response1.message);
    console.log('   Action:', response1.action);
    console.log('   Success:', response1.success);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Property creation
  console.log('🏠 Test 2: Property Creation');
  try {
    const response2 = await AIService.sendMessage('Create a new property called "Sunset Apartments" with 20 units');
    console.log('✅ Response:', response2.message);
    console.log('   Action:', response2.action);
    console.log('   Parameters:', response2.parameters);
    
    if (response2.action && response2.action !== 'ANSWER_QUESTION') {
      const actionResult = await AIService.executeAction(response2.action, response2.parameters || {}, {});
      console.log('   Action Result:', actionResult.message);
      console.log('   Action Success:', actionResult.success);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Tenant creation
  console.log('👥 Test 3: Tenant Creation');
  try {
    const response3 = await AIService.sendMessage('Add a new tenant named John Doe with email john@example.com');
    console.log('✅ Response:', response3.message);
    console.log('   Action:', response3.action);
    console.log('   Parameters:', response3.parameters);
    
    if (response3.action && response3.action !== 'ANSWER_QUESTION') {
      const actionResult = await AIService.executeAction(response3.action, response3.parameters || {}, {});
      console.log('   Action Result:', actionResult.message);
      console.log('   Action Success:', actionResult.success);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Analytics request
  console.log('📊 Test 4: Analytics Request');
  try {
    const response4 = await AIService.sendMessage('Show me analytics for all properties');
    console.log('✅ Response:', response4.message);
    console.log('   Action:', response4.action);
    console.log('   Parameters:', response4.parameters);
    
    if (response4.action && response4.action !== 'ANSWER_QUESTION') {
      const actionResult = await AIService.executeAction(response4.action, response4.parameters || {}, {});
      console.log('   Action Result:', actionResult.message);
      console.log('   Action Success:', actionResult.success);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Check Gemini availability
  console.log('🔧 Test 5: System Status');
  console.log('✅ Gemini Available:', AIService.isGeminiReady());
  console.log('✅ Rate Limit Count:', 'Check console for current count');

  console.log('\n🎉 AI Assistant testing completed!');
}

// Run the test
testAIAssistant().catch(console.error);
