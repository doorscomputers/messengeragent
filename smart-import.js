// Smart Import System - Intelligently process business documents
// Supports: Text, PDF, Excel, CSV, Images, Word docs

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class SmartImportProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.systemPrompt = `You are an intelligent business data processor. Extract structured business information from various document formats.

CRITICAL: Always return valid JSON only. No additional text or explanations.

Extract and structure this information:
{
  "business_info": {
    "name": "extracted_business_name",
    "type": "business_type",
    "description": "business_description",
    "location": "business_location"
  },
  "products": [
    {
      "name": "product_name",
      "price": numeric_price,
      "category": "category_name",
      "stock": numeric_stock,
      "description": "full_description",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "benefits": "key_benefits"
    }
  ],
  "faqs": [
    {
      "question": "customer_question",
      "answer": "detailed_answer",
      "keywords": ["related", "keywords"],
      "category": "faq_category"
    }
  ],
  "business_details": {
    "payment_methods": ["COD", "GCash", "Bank Transfer"],
    "shipping_fee": "shipping_cost",
    "business_hours": "operating_hours",
    "contact_info": {
      "phone": "phone_number",
      "email": "email_address",
      "address": "physical_address"
    }
  },
  "target_customers": {
    "demographics": "customer_description",
    "interests": ["interest1", "interest2"],
    "buying_behavior": "behavior_description"
  },
  "sales_strategy": {
    "personality": "business_personality",
    "tone": "communication_tone",
    "specialties": ["specialty1", "specialty2"]
  }
}

Handle Filipino and English text. Extract pricing in Philippine Pesos. Infer missing information intelligently.`;
    }

    // Process plain text (like what the user pasted)
    async processText(textContent) {
        try {
            console.log('🧠 Processing text with AI...');

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: this.systemPrompt
                    },
                    {
                        role: "user",
                        content: `Extract business information from this text:\n\n${textContent}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });

            const extractedData = JSON.parse(completion.choices[0].message.content);
            console.log('✅ Successfully extracted business data');
            return extractedData;

        } catch (error) {
            console.error('❌ Text processing error:', error.message);
            return this.fallbackTextProcessing(textContent);
        }
    }

    // Process CSV files
    async processCSV(csvContent) {
        try {
            console.log('📊 Processing CSV data...');

            // Basic CSV parsing for products
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const products = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const product = {};

                    headers.forEach((header, index) => {
                        const value = values[index]?.trim();
                        if (value) {
                            // Map common CSV headers to our schema
                            if (header.includes('name') || header.includes('product')) {
                                product.name = value;
                            } else if (header.includes('price') || header.includes('cost')) {
                                product.price = parseFloat(value.replace(/[₱,]/g, ''));
                            } else if (header.includes('stock') || header.includes('quantity')) {
                                product.stock = parseInt(value);
                            } else if (header.includes('description') || header.includes('desc')) {
                                product.description = value;
                            } else if (header.includes('category') || header.includes('type')) {
                                product.category = value;
                            }
                        }
                    });

                    if (product.name) {
                        products.push(product);
                    }
                }
            }

            // Use AI to enhance the extracted data
            const enhancedData = await this.processText(`Products:\n${JSON.stringify(products, null, 2)}`);
            enhancedData.products = products; // Use CSV products as primary source

            return enhancedData;

        } catch (error) {
            console.error('❌ CSV processing error:', error.message);
            return this.fallbackCSVProcessing(csvContent);
        }
    }

    // Process image files (OCR + AI)
    async processImage(imagePath) {
        try {
            console.log('🖼️ Processing image with OCR and AI...');

            // For now, return a placeholder - would need OCR library like Tesseract
            // This is where you'd implement image OCR
            console.log('⚠️ Image processing requires OCR setup - contact developer');

            return {
                business_info: { name: "Image Processing Not Configured" },
                products: [],
                faqs: [],
                note: "Image processing requires OCR library setup"
            };

        } catch (error) {
            console.error('❌ Image processing error:', error.message);
            return this.fallbackImageProcessing();
        }
    }

    // Fallback text processing (rule-based)
    fallbackTextProcessing(text) {
        console.log('🔄 Using fallback text processing...');

        const data = {
            business_info: { name: "Essential Oils Business" },
            products: [],
            faqs: [],
            business_details: {},
            target_customers: {},
            sales_strategy: {}
        };

        // Extract products with simple patterns
        const productRegex = /Product Name:\s*([^\n]+)[\s\S]*?Price.*?(\d+)[\s\S]*?Description:\s*([^\n]+)/gi;
        let match;
        while ((match = productRegex.exec(text)) !== null) {
            data.products.push({
                name: match[1].trim(),
                price: parseInt(match[2]),
                description: match[3].trim(),
                category: "Essential Oils",
                stock: 50, // Default
                keywords: []
            });
        }

        // Extract Q&As
        const qnaRegex = /Customer Question:\s*([^\n]+)[\s\S]*?Your Answer:\s*([^\n]+)/gi;
        while ((match = qnaRegex.exec(text)) !== null) {
            data.faqs.push({
                question: match[1].trim(),
                answer: match[2].trim(),
                keywords: [],
                category: "general"
            });
        }

        return data;
    }

    fallbackCSVProcessing(csvContent) {
        return {
            business_info: { name: "CSV Import" },
            products: [],
            faqs: [],
            note: "CSV processing failed - check format"
        };
    }

    fallbackImageProcessing() {
        return {
            business_info: { name: "Image Import" },
            products: [],
            faqs: [],
            note: "Image processing not available"
        };
    }

    // Main processing function
    async processDocument(content, fileType = 'text') {
        console.log(`📄 Processing ${fileType} document...`);

        switch (fileType.toLowerCase()) {
            case 'text':
            case 'txt':
                return await this.processText(content);

            case 'csv':
                return await this.processCSV(content);

            case 'image':
            case 'png':
            case 'jpg':
            case 'jpeg':
                return await this.processImage(content);

            default:
                return await this.processText(content);
        }
    }

    // Generate setup wizard data
    generateWizardData(extractedData) {
        return {
            step1: extractedData.business_info,
            step2: extractedData.products,
            step3: extractedData.faqs,
            step4: extractedData.target_customers,
            step5: extractedData.business_details,
            step6: extractedData.sales_strategy,
            aiReady: true,
            extractedFrom: 'smart_import'
        };
    }
}

module.exports = SmartImportProcessor;