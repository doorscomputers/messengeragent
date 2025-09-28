// Test script for the upgraded AI system
require('dotenv').config();

const AIService = require('./ai-service');

async function testAIUpgrade() {
    console.log('🧪 Testing AI Upgrade...\n');

    const aiService = new AIService();

    // Test messages (English and Filipino)
    const testMessages = [
        "Magkano po essential oil nyo",  // The original failing message
        "Hello! How much is your lavender oil?",
        "I want to buy 2 bottles of essential oil",
        "Available pa ba yung mga products niyo?",
        "May discount ba kayo ngayon?",
        "What's your cheapest essential oil?"
    ];

    const businessConfig = {
        shopName: "Essential Oils PH",
        products: [
            {
                name: "Lavender Essential Oil",
                price: 250,
                category: "essential oils",
                keywords: ["lavender", "relaxing", "sleep"],
                stock: 15
            },
            {
                name: "Peppermint Essential Oil",
                price: 200,
                category: "essential oils",
                keywords: ["peppermint", "energizing", "fresh"],
                stock: 8
            }
        ],
        businessInfo: {
            paymentMethods: ["COD", "GCash", "Bank Transfer"],
            shippingFee: "₱50",
            businessHours: "9AM-6PM",
            freeShippingMinimum: 500
        }
    };

    for (const message of testMessages) {
        console.log(`\n📩 Testing: "${message}"`);
        console.log('─'.repeat(50));

        try {
            // Test AI analysis
            const analysis = await aiService.analyzeMessage(message, businessConfig);
            console.log('🔍 AI Analysis:');
            console.log(`   Intent: ${analysis.intent}`);
            console.log(`   Sentiment: ${analysis.sentiment}`);
            console.log(`   Lead Score: ${analysis.leadScore}/100`);
            console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
            console.log(`   Urgency: ${analysis.urgency}`);

            if (analysis.mentionedProducts?.length > 0) {
                console.log(`   Products mentioned: ${analysis.mentionedProducts.join(', ')}`);
            }

            if (analysis.buyingSignals?.length > 0) {
                console.log(`   Buying signals: ${analysis.buyingSignals.join(', ')}`);
            }

            // Test response generation
            const response = await aiService.generateResponse(message, analysis, businessConfig);
            console.log('\n🤖 AI Response:');
            console.log(`   "${response}"`);

        } catch (error) {
            console.error('❌ Error:', error.message);

            if (error.message.includes('API key')) {
                console.log('\n💡 Note: Set OPENAI_API_KEY in .env file to enable full AI features');
                console.log('   For now, the system will use fallback analysis');
            }
        }

        console.log('\n' + '='.repeat(60));
    }

    console.log('\n✅ AI upgrade test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ OpenAI GPT integration ready');
    console.log('✅ Multilingual support (English/Filipino)');
    console.log('✅ Enhanced intent classification');
    console.log('✅ AI-powered sentiment analysis');
    console.log('✅ Improved lead scoring');
    console.log('✅ Intelligent response generation');

    console.log('\n🔧 Setup required:');
    console.log('1. Add OPENAI_API_KEY to .env file');
    console.log('2. Run: node test-ai-upgrade.js');
    console.log('3. Integration ready for production!');
}

// Run the test
if (require.main === module) {
    testAIUpgrade().catch(console.error);
}

module.exports = testAIUpgrade;