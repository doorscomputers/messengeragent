// Test Smart Import Feature
require('dotenv').config();

const SmartImportProcessor = require('./smart-import');

async function testSmartImport() {
    console.log('🧪 Testing Smart Import Feature...\n');

    const smartImport = new SmartImportProcessor();

    // Your actual business data
    const businessData = `
Product Name: Lemon Essential Oil (10ml)
Price (₱): 320
Category: Essential Oils
Stock Quantity: 65
Product Description: Sparkling, zesty oil cold-pressed from Citrus limon peel. Instantly brightens mood and cuts through cooking smells. May increase sun sensitivity on skin—dilute and avoid direct sun for 12–24h after topical use.
Key Benefits: Bright, clean aroma, kitchen + office deodorizer, productivity pick-me-up
Keywords: lemon, citrus, clean, fresh, deodorize, office, kitchen, uplifting, diffuser, pure

Product Name: Frankincense Serrata Essential Oil (10ml)
Price (₱): 720
Category: Essential Oils
Stock Quantity: 40
Product Description: Resinous, woody-citrus oil steam-distilled from Boswellia serrata. Grounding aroma for meditation, slow mornings, and sophisticated home blends. Sustainably sourced; batch-tested for purity.
Key Benefits: Centering, tranquil ambiance, resinous depth for premium blends
Keywords: frankincense, resin, grounding, meditation, woody, premium, pure, diffuser, serenity

Q&A 1
Customer Question: Are your essential oils 100% pure?
Your Answer: Yes. Our oils are 100% pure and undiluted—no carriers, fillers, or synthetic fragrance. Each batch is GC/MS-tested by a third-party lab, and results are available by batch number on request.
Related Keywords: pure, undiluted, GC/MS, lab tested, authentic, quality, certification

Q&A 2
Customer Question: Where do you source your oils?
Your Answer: We partner with vetted farms and distillers in regions where each plant thrives (e.g., lavender from high-altitude fields, citrus from fresh peels). We prioritize fair, sustainable sourcing and provide country of origin on every product page.
Related Keywords: sourcing, farms, distillers, sustainable, fair trade, origin, traceability

Q&A 3
Customer Question: How do I use essential oils in a diffuser?
Your Answer: Add 3–6 drops of essential oil per 100 ml of water and diffuse for 15–30 minutes, then take a break. Start small and adjust to your room size and preference.
Related Keywords: diffuser, how to use, drops, aromatherapy, instructions, room size
`;

    try {
        console.log('🧠 Processing business data with AI...\n');

        const result = await smartImport.processText(businessData);

        console.log('✅ Smart Import Results:');
        console.log('━'.repeat(60));

        console.log('\n🏢 Business Info:');
        console.log(`   Name: ${result.business_info?.name || 'Not extracted'}`);
        console.log(`   Type: ${result.business_info?.type || 'Not extracted'}`);

        console.log('\n📦 Products Extracted:');
        if (result.products && result.products.length > 0) {
            result.products.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name}`);
                console.log(`      Price: ₱${product.price}`);
                console.log(`      Category: ${product.category}`);
                console.log(`      Keywords: ${product.keywords?.slice(0, 3).join(', ')}...`);
                console.log('');
            });
        } else {
            console.log('   No products extracted');
        }

        console.log('\n❓ FAQs Extracted:');
        if (result.faqs && result.faqs.length > 0) {
            result.faqs.forEach((faq, index) => {
                console.log(`   ${index + 1}. ${faq.question}`);
                console.log(`      Answer: ${faq.answer.substring(0, 80)}...`);
                console.log('');
            });
        } else {
            console.log('   No FAQs extracted');
        }

        console.log('\n💰 Business Details:');
        console.log(`   Payment Methods: ${result.business_details?.payment_methods?.join(', ') || 'Not extracted'}`);
        console.log(`   Shipping: ${result.business_details?.shipping_fee || 'Not extracted'}`);

        console.log('\n🎯 Ready for Setup Wizard:');
        const wizardData = smartImport.generateWizardData(result);
        console.log(`   ✅ Step 1 (Business): ${wizardData.step1 ? 'Ready' : 'Needs input'}`);
        console.log(`   ✅ Step 2 (Products): ${wizardData.step2?.length || 0} products ready`);
        console.log(`   ✅ Step 3 (FAQs): ${wizardData.step3?.length || 0} FAQs ready`);
        console.log(`   ✅ Step 4-6: ${wizardData.aiReady ? 'AI-enhanced setup ready' : 'Manual setup required'}`);

        console.log('\n🚀 Next Steps:');
        console.log('   1. Open: http://localhost:3000/import');
        console.log('   2. Paste your business data');
        console.log('   3. Click "Process with AI"');
        console.log('   4. Review and continue to setup wizard');
        console.log('   5. Test with your Facebook page!');

        return result;

    } catch (error) {
        console.error('❌ Smart Import Test Failed:', error.message);

        if (error.message.includes('API key') || error.message.includes('quota')) {
            console.log('\n💡 Note: Using fallback processing without OpenAI');
            const fallbackResult = smartImport.fallbackTextProcessing(businessData);
            console.log('✅ Fallback extraction successful:');
            console.log(`   Products: ${fallbackResult.products?.length || 0}`);
            console.log(`   FAQs: ${fallbackResult.faqs?.length || 0}`);
            return fallbackResult;
        }

        throw error;
    }
}

// Run test
if (require.main === module) {
    testSmartImport()
        .then(() => {
            console.log('\n🎉 Smart Import test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = testSmartImport;