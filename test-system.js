// Test script for the enhanced FB Messenger Agent
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test messages in both English and Filipino
const testMessages = [
  {
    message: "Hi! I am interested in your essential oils. How much do they cost?",
    language: "English",
    expected: "High lead score, product inquiry intent"
  },
  {
    message: "Magkano po ang essential oil set ninyo?",
    language: "Filipino",
    expected: "Price inquiry intent, medium lead score"
  },
  {
    message: "I want to buy 3 bottles of lavender oil now!",
    language: "English",
    expected: "Very high lead score, purchase intent, order processing"
  },
  {
    message: "Gusto ko po bumili ng dalawang bote ng lavender oil. Magkano po lahat?",
    language: "Filipino",
    expected: "High lead score, purchase intent with quantity"
  },
  {
    message: "Do you have any discounts or promos?",
    language: "English",
    expected: "Price conscious tag, promotion inquiry"
  },
  {
    message: "May discount po ba kayo ngayon? Saan ko pwedeng makuha?",
    language: "Filipino",
    expected: "Price conscious, delivery inquiry"
  },
  {
    message: "Hello, may tanong lang po ako about sa products ninyo",
    language: "Filipino",
    expected: "Basic inquiry, awareness stage"
  },
  {
    message: "URGENT! Need essential oils today! Cash ready!",
    language: "English",
    expected: "Ultra high lead score, urgency signals"
  }
];

async function testMessage(testData, index) {
  try {
    console.log(`\n=== TEST ${index + 1}: ${testData.language} ===`);
    console.log(`Message: "${testData.message}"`);
    console.log(`Expected: ${testData.expected}`);

    const response = await axios.post(`${BASE_URL}/test/message`, {
      message: testData.message,
      userName: `TestUser_${index + 1}`
    });

    const result = response.data;

    console.log(`\n✅ RESULTS:`);
    console.log(`Lead Score: ${result.leadScore}/100`);
    console.log(`Intent: ${result.analysis.intent}`);
    console.log(`Sentiment: ${result.analysis.sentiment}`);
    console.log(`Confidence: ${result.analysis.confidence}`);
    console.log(`Urgency: ${result.urgency}`);

    if (result.mentionedProducts && result.mentionedProducts.length > 0) {
      console.log(`Products Mentioned: ${result.mentionedProducts.map(p => p.name).join(', ')}`);
    }

    if (result.orderStatus) {
      console.log(`Order Status: ${result.orderStatus}`);
      if (result.orderTotal) {
        console.log(`Order Total: $${result.orderTotal}`);
      }
    }

    console.log(`\nBot Response: "${result.response}"`);

    return result;

  } catch (error) {
    console.error(`❌ Error testing message ${index + 1}:`, error.response?.data || error.message);
    return null;
  }
}

async function testAnalytics() {
  try {
    console.log(`\n\n🔍 TESTING ANALYTICS ENDPOINTS:`);

    // Test real-time metrics
    console.log(`\n1. Real-time Conversion Metrics:`);
    const metricsResponse = await axios.get(`${BASE_URL}/analytics/conversion/realtime`);
    console.log(JSON.stringify(metricsResponse.data.metrics, null, 2));

    // Test conversion analytics
    console.log(`\n2. Conversion Analytics Report (7 days):`);
    const analyticsResponse = await axios.get(`${BASE_URL}/analytics/conversion?timeframe=7d`);
    console.log(`Total Customers: ${analyticsResponse.data.report.summary.totalCustomers}`);
    console.log(`Conversion Rate: ${analyticsResponse.data.report.summary.conversionRate}%`);
    console.log(`Average Engagement: ${analyticsResponse.data.report.summary.averageEngagementScore}`);

    // Test funnel analysis
    console.log(`\n3. Conversion Funnel:`);
    const funnelResponse = await axios.get(`${BASE_URL}/analytics/funnel?timeframe=7d`);
    Object.entries(funnelResponse.data.funnel).forEach(([stage, data]) => {
      console.log(`${stage}: ${data.count} customers (${data.dropoff}% dropoff)`);
    });

  } catch (error) {
    console.error(`❌ Error testing analytics:`, error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 STARTING ENHANCED FB MESSENGER AGENT TESTS');
  console.log('='.repeat(60));

  // Test each message
  const results = [];
  for (let i = 0; i < testMessages.length; i++) {
    const result = await testMessage(testMessages[i], i);
    if (result) {
      results.push(result);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test analytics after generating some data
  await testAnalytics();

  console.log(`\n\n📊 SUMMARY:`);
  console.log(`Total Tests: ${testMessages.length}`);
  console.log(`Successful: ${results.length}`);
  console.log(`Average Lead Score: ${(results.reduce((sum, r) => sum + r.leadScore, 0) / results.length).toFixed(1)}`);

  // Show high-scoring leads
  const highScoreLeads = results.filter(r => r.leadScore >= 60);
  console.log(`High-scoring leads (≥60): ${highScoreLeads.length}`);

  if (highScoreLeads.length > 0) {
    console.log(`\n🎯 TOP LEADS:`);
    highScoreLeads.forEach((result, index) => {
      const testData = testMessages[results.indexOf(result)];
      console.log(`${index + 1}. Score: ${result.leadScore} - "${testData.message}" (${testData.language})`);
    });
  }

  console.log(`\n✅ Testing complete! Check http://localhost:3000 for the dashboard.`);
}

// Run the tests
runAllTests().catch(console.error);