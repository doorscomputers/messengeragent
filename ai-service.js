// AI Service using OpenAI GPT for intelligent message analysis
// Replaces the rule-based system with actual AI

const OpenAI = require('openai');

class AIService {
    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            this.hasOpenAI = true;
        } else {
            this.openai = null;
            this.hasOpenAI = false;
            console.warn('⚠️ OpenAI API key not found. AI will use fallback analysis.');
        }

        this.systemPrompt = `You are an AI assistant for an e-commerce business that analyzes customer messages and provides structured analysis.

IMPORTANT: You must ALWAYS respond with valid JSON only. No additional text, explanations, or formatting.

Your task is to analyze customer messages (in English or Filipino) and return structured data about:
1. Intent classification
2. Sentiment analysis
3. Lead scoring (0-100)
4. Product mentions
5. Urgency level
6. Confidence score
7. Buying signals
8. Contact information extraction

Response format (JSON only):
{
  "intent": "greeting|product_inquiry|price_inquiry|purchase_intent|availability_check|support|comparison|general",
  "sentiment": "positive|negative|neutral",
  "leadScore": 0-100,
  "mentionedProducts": ["product1", "product2"],
  "urgency": "low|medium|high",
  "confidence": 0.0-1.0,
  "buyingSignals": ["signal1", "signal2"],
  "contactInfo": {
    "phone": "extracted_phone",
    "email": "extracted_email",
    "name": "extracted_name"
  },
  "orderDetails": {
    "quantity": extracted_number,
    "variant": "size/color/type",
    "address": "delivery_address"
  },
  "analysis": {
    "keyPhrases": ["important", "phrases"],
    "emotion": "excited|curious|frustrated|happy|neutral",
    "buyingStage": "awareness|consideration|decision|purchase",
    "priority": "low|medium|high"
  }
}

Scoring guidelines:
- Lead Score: Price inquiry (20-30), Purchase intent (40-60), Urgency indicators (+10-20), Contact sharing (+15-25)
- Confidence: Clear intent (0.8+), Specific products (0.7+), Vague messages (0.3-0.5)
- Handle both English and Filipino text appropriately`;
    }

    async analyzeMessage(message, businessConfig = {}) {
        try {
            if (!this.hasOpenAI) {
                return this.fallbackAnalysis(message);
            }

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: this.systemPrompt
                    },
                    {
                        role: "user",
                        content: `Analyze this customer message: "${message}"`
                    }
                ],
                temperature: 0.1,
                max_tokens: 500
            });

            const analysis = JSON.parse(completion.choices[0].message.content);

            // Enhance with business-specific product matching
            if (businessConfig.products) {
                analysis.mentionedProducts = this.enhanceProductMatching(
                    message,
                    businessConfig.products,
                    analysis.mentionedProducts
                );
            }

            return analysis;

        } catch (error) {
            console.error('❌ AI analysis error:', error.message);
            return this.fallbackAnalysis(message);
        }
    }

    // Enhanced product matching using both AI and business catalog
    enhanceProductMatching(message, products, aiMentioned) {
        const messageLower = message.toLowerCase();
        const mentioned = new Set(aiMentioned);

        products.forEach(product => {
            // Check product name
            if (messageLower.includes(product.name.toLowerCase())) {
                mentioned.add(product.name);
            }

            // Check keywords if available
            if (product.keywords) {
                product.keywords.forEach(keyword => {
                    if (messageLower.includes(keyword.toLowerCase())) {
                        mentioned.add(product.name);
                    }
                });
            }

            // Check category
            if (product.category && messageLower.includes(product.category.toLowerCase())) {
                mentioned.add(product.name);
            }
        });

        return Array.from(mentioned);
    }

    // Fallback analysis when AI is unavailable
    fallbackAnalysis(message) {
        const messageLower = message.toLowerCase();

        // Basic intent detection
        let intent = 'general';
        if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('kumusta')) {
            intent = 'greeting';
        } else if (messageLower.includes('buy') || messageLower.includes('order') || messageLower.includes('bili')) {
            intent = 'purchase_intent';
        } else if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('magkano')) {
            intent = 'price_inquiry';
        } else if (messageLower.includes('available') || messageLower.includes('stock')) {
            intent = 'availability_check';
        }

        // Basic sentiment
        let sentiment = 'neutral';
        const positiveWords = ['good', 'great', 'love', 'excellent', 'maganda', 'ok'];
        const negativeWords = ['bad', 'terrible', 'problem', 'pangit', 'hindi'];

        if (positiveWords.some(word => messageLower.includes(word))) {
            sentiment = 'positive';
        } else if (negativeWords.some(word => messageLower.includes(word))) {
            sentiment = 'negative';
        }

        // Basic lead scoring
        let leadScore = 10;
        if (intent === 'purchase_intent') leadScore += 40;
        if (intent === 'price_inquiry') leadScore += 25;
        if (messageLower.includes('urgent') || messageLower.includes('asap')) leadScore += 15;

        return {
            intent,
            sentiment,
            leadScore: Math.min(leadScore, 100),
            mentionedProducts: [],
            urgency: leadScore > 40 ? 'high' : leadScore > 20 ? 'medium' : 'low',
            confidence: 0.6,
            buyingSignals: [],
            contactInfo: {},
            orderDetails: {},
            analysis: {
                keyPhrases: [message.split(' ').slice(0, 3).join(' ')],
                emotion: 'neutral',
                buyingStage: 'awareness',
                priority: 'medium'
            }
        };
    }

    // Generate intelligent response using AI
    async generateResponse(message, analysis, businessConfig = {}) {
        try {
            if (!this.hasOpenAI) {
                return this.fallbackResponse(analysis, businessConfig);
            }

            const context = this.buildResponseContext(analysis, businessConfig);

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful e-commerce customer service assistant for ${businessConfig.shopName || 'our store'}.

                        Response guidelines:
                        - Be friendly, professional, and helpful
                        - Handle both English and Filipino customers naturally
                        - Focus on converting leads to sales
                        - Provide specific product information when available
                        - Include emojis appropriately
                        - Keep responses concise but informative
                        - Always end with a call-to-action or question to continue engagement

                        Business context: ${context}`
                    },
                    {
                        role: "user",
                        content: `Customer message: "${message}"

                        Analysis: ${JSON.stringify(analysis)}

                        Generate an appropriate response:`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            });

            return completion.choices[0].message.content.trim();

        } catch (error) {
            console.error('❌ Response generation error:', error.message);
            return this.fallbackResponse(analysis, businessConfig);
        }
    }

    // Build context for response generation
    buildResponseContext(analysis, businessConfig) {
        let context = [];

        if (businessConfig.products && businessConfig.products.length > 0) {
            context.push(`Available products: ${businessConfig.products.map(p => p.name).join(', ')}`);
        }

        if (businessConfig.businessInfo) {
            const info = businessConfig.businessInfo;
            if (info.paymentMethods) {
                context.push(`Payment methods: ${info.paymentMethods.join(', ')}`);
            }
            if (info.shippingFee) {
                context.push(`Shipping fee: ${info.shippingFee}`);
            }
            if (info.businessHours) {
                context.push(`Business hours: ${info.businessHours}`);
            }
        }

        return context.join('. ');
    }

    // Fallback response when AI is unavailable
    fallbackResponse(analysis, businessConfig) {
        const shopName = businessConfig.shopName || 'our store';

        switch (analysis.intent) {
            case 'greeting':
                return `Hello! Welcome to ${shopName}! 😊 How can I help you today?`;

            case 'price_inquiry':
                return `I'd be happy to help with pricing! 💰 Which product would you like to know about?`;

            case 'purchase_intent':
                return `Great! I'm excited to help you with your order! 🛒 What would you like to purchase?`;

            case 'availability_check':
                return `Let me check our inventory for you! 📦 Which product are you interested in?`;

            default:
                return `Thank you for your message! I'm here to help you find exactly what you need at ${shopName}. What can I show you today? 😊`;
        }
    }

    // Test the AI service
    async testAnalysis(testMessage) {
        console.log('🧪 Testing AI Analysis...');
        console.log('Message:', testMessage);

        const result = await this.analyzeMessage(testMessage);
        console.log('Analysis Result:', JSON.stringify(result, null, 2));

        const response = await this.generateResponse(testMessage, result, {
            shopName: 'Essential Oils PH',
            products: [
                { name: 'Lavender Essential Oil', price: 250, category: 'essential oils' }
            ]
        });
        console.log('Generated Response:', response);

        return { analysis: result, response };
    }
}

module.exports = AIService;