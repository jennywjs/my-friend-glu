#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';

// Test data
const testUser = {
  email: 'mato@example.com',
  password: 'password123',
  name: 'Mato'
};

const testMeal = {
  description: 'Half plate Kung Pao chicken, 1 bok choy, 1 small bowl of rice, spicy and sour soup',
  mealType: 'LUNCH'
};

let authToken = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`\n${options.method || 'GET'} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { response: null, data: null };
  }
}

// Test functions
async function testRegistration() {
  console.log('\n🧪 Testing User Registration...');
  const { data } = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (data && data.token) {
    authToken = data.token;
    console.log('✅ Registration successful, token saved');
  }
}

async function testLogin() {
  console.log('\n🧪 Testing User Login...');
  const { data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  
  if (data && data.token) {
    authToken = data.token;
    console.log('✅ Login successful, token saved');
  }
}

async function testMealLogging() {
  console.log('\n🧪 Testing Meal Logging...');
  const { data } = await apiRequest('/meals', {
    method: 'POST',
    body: JSON.stringify(testMeal)
  });
  
  if (data && data.meal) {
    console.log('✅ Meal logged successfully');
  }
}

async function testMealHistory() {
  console.log('\n🧪 Testing Meal History...');
  await apiRequest('/meals');
}

async function testAIAnalysis() {
  console.log('\n🧪 Testing AI Analysis...');
  await apiRequest('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({
      description: testMeal.description,
      action: 'analyze'
    })
  });
}

async function testClarifyingQuestions() {
  console.log('\n🧪 Testing Clarifying Questions...');
  await apiRequest('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({
      description: 'rice and chicken',
      action: 'clarify'
    })
  });
}

async function testUserProfile() {
  console.log('\n🧪 Testing User Profile...');
  await apiRequest('/user/profile');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests for My Friend Glu');
  console.log('=======================================');
  
  // Check if server is running
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      console.log('⚠️  Server is running but API might not be ready');
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: npm run dev');
    return;
  }
  
  // Run tests in sequence
  await testRegistration();
  await testLogin();
  await testMealLogging();
  await testMealHistory();
  await testAIAnalysis();
  await testClarifyingQuestions();
  await testUserProfile();
  
  console.log('\n🎉 API Tests Complete!');
  console.log('=====================');
  console.log('\nIf all tests passed, your backend is working correctly!');
  console.log('\nNext steps:');
  console.log('1. Integrate with your frontend application');
  console.log('2. Set up proper error handling in your frontend');
  console.log('3. Add loading states for better UX');
  console.log('4. Consider adding rate limiting for production');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  apiRequest,
  testRegistration,
  testLogin,
  testMealLogging,
  testMealHistory,
  testAIAnalysis,
  testClarifyingQuestions,
  testUserProfile,
  runTests
};
