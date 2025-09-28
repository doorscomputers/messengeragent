// AI Intelligence Engine for FB Messenger Agent
// Advanced learning system that improves responses based on customer interactions
// Now powered by OpenAI GPT for superior accuracy

const AIService = require('./ai-service');

class AIIntelligence {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.orderProcessor = new (require('./order-processor'))(databaseManager);
        this.leadTaggingSystem = new (require('./lead-tagging-system'))(databaseManager);
        this.spreadsheetManager = new (require('./spreadsheet-manager'))();
        this.conversionTracker = new (require('./conversion-tracker'))(databaseManager);
        this.learningPatterns = new Map();
        this.conversationContext = new Map();

        // New AI-powered services
        this.aiService = new AIService();

        // Keep legacy classes as fallback
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.intentClassifier = new IntentClassifier();
        this.responseOptimizer = new ResponseOptimizer();

        console.log('🧠 AI Intelligence Engine initialized with OpenAI GPT');
        this.loadLearningPatterns();
    }

    // Initialize spreadsheet integration
    async initializeSpreadsheet(credentials, spreadsheetId) {
        try {
            if (credentials && spreadsheetId) {
                const success = await this.spreadsheetManager.initialize(credentials, spreadsheetId);
                if (success) {
                    console.log('📊 Spreadsheet integration enabled');
                    return true;
                }
            }
            console.log('📊 Spreadsheet integration disabled (no credentials provided)');
            return false;
        } catch (error) {
            console.error('❌ Error initializing spreadsheet:', error);
            return false;
        }
    }

    // Load existing learning patterns from database
    async loadLearningPatterns() {
        try {
            // Implementation for loading patterns would go here
            console.log('📚 Loading AI learning patterns...');
            // For now, we'll start fresh and learn from new interactions
        } catch (error) {
            console.error('❌ Error loading learning patterns:', error);
        }
    }

    // Analyze customer message and generate intelligent response
    async processMessage(customerId, message, businessConfig) {
        try {
            // 1. Use AI service for advanced message analysis
            const analysis = await this.aiService.analyzeMessage(message, businessConfig);

            // 2. Get conversation context
            const context = this.getConversationContext(customerId);

            // 3. Enhanced product identification (AI + business catalog)
            const mentionedProducts = analysis.mentionedProducts.length > 0
                ? this.getProductsByNames(analysis.mentionedProducts, businessConfig.products)
                : this.identifyMentionedProducts(message, businessConfig.products);

            // 4. Use AI-enhanced lead scoring
            const leadScore = analysis.leadScore || this.calculateLeadScore(message, analysis, context);

            // 5. Check for order processing opportunity
            const orderResult = await this.orderProcessor.processOrderFlow(
                customerId, message, analysis, mentionedProducts, businessConfig
            );

            // 6. Generate AI-powered response (order-focused or general)
            let response;
            let orderStatus = null;

            if (orderResult && orderResult.response) {
                response = orderResult.response;
                orderStatus = orderResult.orderStatus;
            } else {
                // Use AI service for response generation
                response = await this.aiService.generateResponse(message, analysis, businessConfig);
            }

            // 7. Tag customer based on behavior and analysis
            const customerTags = await this.leadTaggingSystem.tagCustomer(
                customerId, analysis, mentionedProducts, orderStatus, context
            );

            // 8. Update conversation context
            this.updateConversationContext(customerId, message, response, analysis);

            // 9. Track conversion journey
            await this.conversionTracker.trackInteraction(customerId, {
                message,
                response,
                leadScore,
                intent: analysis.intent,
                mentionedProducts,
                orderStatus,
                customerTags,
                timestamp: new Date()
            });

            // 10. Log interaction for learning and spreadsheet
            await this.logInteractionForLearning({
                customerId,
                message,
                response,
                analysis,
                mentionedProducts,
                leadScore,
                context,
                orderStatus,
                customerTags
            });

            return {
                response,
                analysis,
                leadScore,
                mentionedProducts,
                urgency: this.determineUrgency(analysis, leadScore),
                orderStatus,
                orderTotal: orderResult?.orderTotal || null
            };

        } catch (error) {
            console.error('❌ AI processing error:', error);
            return {
                response: "I apologize, but I'm having trouble processing your message right now. Please try again or contact our support team.",
                analysis: { intent: 'error', sentiment: 'neutral', confidence: 0 },
                leadScore: 0,
                mentionedProducts: [],
                urgency: 'low'
            };
        }
    }

    // Helper method to get product objects from names
    getProductsByNames(productNames, products) {
        if (!products || !Array.isArray(products)) return [];

        return products.filter(product =>
            productNames.some(name =>
                product.name.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(product.name.toLowerCase())
            )
        );
    }

    // Legacy message analysis (kept as fallback)
    async analyzeMessage(message) {
        const analysis = {
            intent: this.intentClassifier.classify(message),
            sentiment: this.sentimentAnalyzer.analyze(message),
            entities: this.extractEntities(message),
            urgencyIndicators: this.detectUrgencyIndicators(message),
            buyingSignals: this.detectBuyingSignals(message),
            contactInfo: this.extractContactInfo(message),
            orderDetails: this.extractOrderDetails(message),
            confidence: this.calculateConfidence(message)
        };

        return analysis;
    }

    // Extract contact information from message
    extractContactInfo(message) {
        const contactInfo = {};
        const messageLower = message.toLowerCase();

        // Phone number patterns
        const phonePatterns = [
            /(\+63|63|0)[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{4}/g, // Philippine mobile
            /(\+63|63|0)[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}/g // Philippine landline
        ];

        phonePatterns.forEach(pattern => {
            const matches = message.match(pattern);
            if (matches) {
                contactInfo.phone = matches[0].replace(/[\s-]/g, '');
            }
        });

        // Email pattern
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emailMatch = message.match(emailPattern);
        if (emailMatch) {
            contactInfo.email = emailMatch[0];
        }

        // Name extraction (simple)
        const namePatterns = [
            /my name is ([a-zA-Z\s]+)/i,
            /i'm ([a-zA-Z\s]+)/i,
            /i am ([a-zA-Z\s]+)/i,
            /name: ([a-zA-Z\s]+)/i
        ];

        namePatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && match[1] && match[1].trim().length > 1) {
                contactInfo.name = match[1].trim();
            }
        });

        return contactInfo;
    }

    // Extract order details from message
    extractOrderDetails(message) {
        const orderDetails = {};
        const messageLower = message.toLowerCase();

        // Quantity patterns
        const quantityPatterns = [
            /(\d+)\s*(pieces?|pcs?|items?)/i,
            /quantity[:\s]*(\d+)/i,
            /i want (\d+)/i,
            /order (\d+)/i
        ];

        quantityPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && match[1]) {
                orderDetails.quantity = parseInt(match[1]);
            }
        });

        // Size/variant patterns
        const sizePatterns = [
            /size[:\s]*(small|medium|large|xs|s|m|l|xl|xxl|\d+)/i,
            /color[:\s]*(\w+)/i,
            /variant[:\s]*(\w+)/i
        ];

        sizePatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && match[1]) {
                orderDetails.variant = match[1];
            }
        });

        // Address indicators
        const addressPatterns = [
            /address[:\s]*(.+)/i,
            /deliver to[:\s]*(.+)/i,
            /location[:\s]*(.+)/i
        ];

        addressPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && match[1]) {
                orderDetails.address = match[1].trim();
            }
        });

        return orderDetails;
    }

    // Enhanced urgency detection
    detectUrgencyIndicators(message) {
        const urgencyKeywords = [
            'urgent', 'asap', 'immediately', 'right now', 'today', 'tonight',
            'rush', 'emergency', 'need fast', 'quick', 'soon', 'this week',
            'before', 'deadline', 'running out', 'last chance', 'limited time'
        ];

        const messageLower = message.toLowerCase();
        return urgencyKeywords.filter(keyword => messageLower.includes(keyword));
    }

    // Enhanced buying signals detection
    detectBuyingSignals(message) {
        const buyingSignals = [];
        const messageLower = message.toLowerCase();

        const signalCategories = {
            'purchase_ready': [
                'buy now', 'order now', 'purchase', 'checkout', 'add to cart',
                'take my order', 'ready to buy', 'i want this'
            ],
            'price_conscious': [
                'how much', 'price', 'cost', 'afford', 'budget', 'cheap',
                'expensive', 'discount', 'sale', 'promo'
            ],
            'decision_making': [
                'compare', 'difference', 'which one', 'recommend', 'suggest',
                'best option', 'decide', 'choice'
            ],
            'availability_check': [
                'available', 'in stock', 'when can', 'delivery', 'shipping',
                'reserve', 'hold', 'book'
            ]
        };

        Object.entries(signalCategories).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (messageLower.includes(keyword)) {
                    buyingSignals.push({ category, keyword });
                }
            });
        });

        return buyingSignals;
    }

    // Calculate confidence score for the analysis
    calculateConfidence(message) {
        let confidence = 0.5; // Base confidence

        // Length-based confidence
        const wordCount = message.split(' ').length;
        if (wordCount > 5) confidence += 0.2;
        if (wordCount > 10) confidence += 0.1;

        // Specificity indicators
        const specificityIndicators = [
            'need', 'want', 'looking for', 'price', 'cost', 'available',
            'buy', 'order', 'purchase', 'delivery', 'shipping'
        ];

        const messageLower = message.toLowerCase();
        specificityIndicators.forEach(indicator => {
            if (messageLower.includes(indicator)) {
                confidence += 0.05;
            }
        });

        return Math.min(confidence, 0.95); // Cap at 95%
    }

    // Identify products mentioned in message
    identifyMentionedProducts(message, products) {
        const mentionedProducts = [];
        const messageLower = message.toLowerCase();

        // Safety check: ensure products is an array
        if (!products || !Array.isArray(products)) {
            console.log('⚠️ No products array provided, using default products');
            products = this.businessConfig?.products || [];
        }

        products.forEach(product => {
            // Check product name
            if (messageLower.includes(product.name.toLowerCase())) {
                mentionedProducts.push(product);
                return;
            }

            // Check keywords
            if (product.keywords) {
                product.keywords.forEach(keyword => {
                    if (messageLower.includes(keyword.toLowerCase())) {
                        mentionedProducts.push(product);
                    }
                });
            }

            // Check category
            if (product.category && messageLower.includes(product.category.toLowerCase())) {
                mentionedProducts.push(product);
            }
        });

        return [...new Set(mentionedProducts)]; // Remove duplicates
    }

    // Advanced lead scoring with comprehensive buying signals detection
    calculateLeadScore(message, analysis, context) {
        let score = 0;
        const messageLower = message.toLowerCase();

        // 1. Intent-based scoring (Enhanced)
        const intentScores = {
            'purchase_intent': 35,        // Strong buying intent
            'price_inquiry': 30,          // Price questions = serious consideration
            'availability_check': 28,     // Checking stock = ready to buy
            'comparison': 25,             // Comparing options = decision stage
            'product_inquiry': 20,        // Learning about products
            'shipping_inquiry': 22,       // Asking about delivery = planning purchase
            'payment_inquiry': 24,        // Payment questions = ready to transact
            'support': 10,                // General support
            'greeting': 5,                // Just starting conversation
            'general': 3                  // Casual browsing
        };

        score += intentScores[analysis.intent] || 0;

        // 2. Advanced Buying Signals Detection
        const buyingSignals = {
            // Ultra high-intent phrases (25+ points each)
            'ultra_high': {
                keywords: [
                    'i want to buy', 'ready to order', 'how to purchase', 'checkout now',
                    'add to cart', 'place order', 'buy now', 'i need this today',
                    'urgent order', 'immediate delivery', 'rush order', 'take my order'
                ],
                score: 25
            },

            // Strong buying signals (15+ points each)
            'high': {
                keywords: [
                    'how much', 'what\'s the price', 'cost', 'total', 'payment',
                    'delivery', 'shipping', 'when can i get', 'available',
                    'in stock', 'reserve', 'hold', 'book', 'cod', 'cash on delivery'
                ],
                score: 15
            },

            // Medium buying signals (10+ points each)
            'medium': {
                keywords: [
                    'interested', 'considering', 'thinking about', 'looking for',
                    'need', 'want', 'recommend', 'suggest', 'best option',
                    'compare', 'difference', 'which one', 'show me'
                ],
                score: 10
            },

            // Budget indicators (20+ points each)
            'budget': {
                keywords: [
                    'budget', 'afford', 'cheap', 'expensive', 'discount',
                    'promo', 'sale', 'offer', 'deal', 'installment', 'free shipping'
                ],
                score: 20
            }
        };

        // Score buying signals
        Object.values(buyingSignals).forEach(category => {
            category.keywords.forEach(keyword => {
                if (messageLower.includes(keyword)) {
                    score += category.score;
                }
            });
        });

        // 3. Urgency Detection (Enhanced)
        const urgencyIndicators = [
            'urgent', 'asap', 'immediately', 'today', 'now', 'rush',
            'emergency', 'need fast', 'quick', 'soon', 'this week', 'tonight'
        ];

        let urgencyCount = 0;
        urgencyIndicators.forEach(indicator => {
            if (messageLower.includes(indicator)) {
                urgencyCount++;
                score += 12; // Higher score for urgency
            }
        });

        // 4. Decision Stage Indicators
        const decisionStages = {
            'ready_to_buy': {
                keywords: ['decided', 'final', 'confirmed', 'yes', 'proceed', 'go ahead', 'sold'],
                score: 30
            },
            'evaluation': {
                keywords: ['compare', 'vs', 'better', 'difference', 'which', 'recommend'],
                score: 18
            },
            'consideration': {
                keywords: ['maybe', 'possibly', 'thinking', 'considering', 'might'],
                score: 8
            }
        };

        Object.values(decisionStages).forEach(stage => {
            stage.keywords.forEach(keyword => {
                if (messageLower.includes(keyword)) {
                    score += stage.score;
                }
            });
        });

        // 5. Sentiment Impact (Enhanced)
        switch (analysis.sentiment) {
            case 'positive':
                score += 15;
                break;
            case 'negative':
                score -= 8; // Less penalty, might still convert
                break;
            case 'neutral':
                score += 2;
                break;
        }

        // 6. Context-based Scoring (Enhanced)
        if (context.interactionCount > 1) {
            score += 8; // Engaged customer
        }
        if (context.interactionCount > 3) {
            score += 12; // Very engaged
        }
        if (context.previousPurchase) {
            score += 25; // Previous customer - high value
        }

        // 7. Product Mention Scoring
        if (analysis.productsMentioned && analysis.productsMentioned.length > 0) {
            score += analysis.productsMentioned.length * 5; // Each product mentioned
        }

        // 8. Qualification Questions Response
        const qualificationResponses = [
            'yes', 'definitely', 'sure', 'absolutely', 'of course',
            'exactly', 'that\'s right', 'correct', 'perfect'
        ];

        qualificationResponses.forEach(response => {
            if (messageLower.includes(response)) {
                score += 8;
            }
        });

        // 9. Contact Information Sharing
        const contactIndicators = [
            'phone', 'number', 'email', 'address', 'location',
            'name is', 'my name', 'contact me', 'call me'
        ];

        contactIndicators.forEach(indicator => {
            if (messageLower.includes(indicator)) {
                score += 20; // Sharing contact = serious interest
            }
        });

        // 10. Order Processing Keywords
        const orderProcessingKeywords = [
            'order', 'purchase', 'buy', 'checkout', 'confirm',
            'proceed', 'details', 'information', 'size', 'quantity'
        ];

        orderProcessingKeywords.forEach(keyword => {
            if (messageLower.includes(keyword)) {
                score += 6;
            }
        });

        // Final score capping and minimum
        score = Math.max(0, Math.min(score, 100));

        // Store detailed scoring breakdown for analytics
        this.lastScoringBreakdown = {
            baseIntent: intentScores[analysis.intent] || 0,
            urgencyCount,
            sentiment: analysis.sentiment,
            contextBonus: context.interactionCount > 1 ? 8 : 0,
            totalScore: score
        };

        return score;
    }

    // Generate intelligent response using learned patterns
    async generateResponse(message, analysis, context, businessConfig) {
        try {
            // Use intent-based response generation
            let response = '';

            switch (analysis.intent) {
                case 'greeting':
                    response = this.generateGreeting(businessConfig, context);
                    break;

                case 'product_inquiry':
                    response = this.generateProductResponse(message, analysis, businessConfig);
                    break;

                case 'price_inquiry':
                    response = this.generatePriceResponse(message, analysis, businessConfig);
                    break;

                case 'purchase_intent':
                    response = this.generatePurchaseResponse(message, analysis, businessConfig);
                    break;

                case 'availability_check':
                    response = this.generateAvailabilityResponse(message, analysis, businessConfig);
                    break;

                case 'support':
                    response = this.generateSupportResponse(message, analysis, businessConfig);
                    break;

                default:
                    response = this.generateGeneralResponse(message, analysis, businessConfig);
            }

            // Add personalization based on context
            response = this.personalizeResponse(response, context, businessConfig);

            return response;

        } catch (error) {
            console.error('❌ Response generation error:', error);
            return "I'd be happy to help you! Could you please tell me more about what you're looking for?";
        }
    }

    // Generate greeting responses
    generateGreeting(businessConfig, context) {
        const greetings = [
            `Welcome to ${businessConfig.shopName}! 😊 How can I help you today?`,
            `Hi there! Thanks for visiting ${businessConfig.shopName}. What can I show you?`,
            `Hello! I'm here to help you find exactly what you need at ${businessConfig.shopName}! 🛍️`
        ];

        if (context.interactionCount > 1) {
            return `Welcome back to ${businessConfig.shopName}! 😊 Great to see you again! How can I assist you today?`;
        }

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Generate product-specific responses
    generateProductResponse(message, analysis, businessConfig) {
        const mentionedProducts = this.identifyMentionedProducts(message, businessConfig.products);

        if (mentionedProducts.length > 0) {
            const product = mentionedProducts[0];
            return `Great choice! Our ${product.name} is one of our bestsellers! 🌟

💰 **Price**: ₱${this.formatPrice(product.price)}
📦 **Stock**: ${product.stock > 0 ? `${product.stock} available` : 'Currently checking availability'}
📝 **Details**: ${product.description}

Would you like to know more about its features or check other options? I'm here to help! 😊`;
        }

        return `I'd love to help you find the perfect product! 🔍 Could you tell me more about what you're looking for? We have a great selection of:

${this.generateProductCategories(businessConfig.products)}

What type of product interests you most?`;
    }

    // Generate price-focused responses
    generatePriceResponse(message, analysis, businessConfig) {
        const mentionedProducts = this.identifyMentionedProducts(message, businessConfig.products);

        if (mentionedProducts.length > 0) {
            const product = mentionedProducts[0];
            let response = `💰 **${product.name}** is competitively priced at **₱${this.formatPrice(product.price)}**

✨ **Why it's worth every peso**:
- ${product.description}
- High quality with great value
- ${businessConfig.businessInfo?.paymentMethods?.includes('Installment') ? '💳 Installment options available' : ''}

${businessConfig.businessInfo?.freeShippingMinimum && product.price >= businessConfig.businessInfo.freeShippingMinimum ?
    '🚚 **FREE SHIPPING** included!' :
    `🚚 Shipping: ${businessConfig.businessInfo?.shippingFee || 'Contact us for rates'}`}`;

            // Add urgency if stock is low
            if (product.stock < 10 && product.stock > 0) {
                response += `\n\n⚠️ **Limited stock**: Only ${product.stock} units left!`;
            }

            response += '\n\nReady to order? Just let me know! 😊';
            return response;
        }

        return "I'd be happy to help with pricing! 💰 Which product would you like to know about? Or I can show you our best deals right now! 🎯";
    }

    // Generate purchase-intent responses
    generatePurchaseResponse(message, analysis, businessConfig) {
        const mentionedProducts = this.identifyMentionedProducts(message, businessConfig.products);

        let response = "That's fantastic! I'm excited to help you with your purchase! 🛒✨\n\n";

        if (mentionedProducts.length > 0) {
            const product = mentionedProducts[0];
            response += `**${product.name}** - ₱${this.formatPrice(product.price)}\n`;

            if (product.stock === 0) {
                response += "❌ Unfortunately, this item is currently out of stock. But I can:\n";
                response += "📞 Check with our warehouse for restock date\n";
                response += "🔄 Suggest similar alternatives\n";
                response += "📧 Notify you when it's back in stock\n\n";
                response += "Which option would you prefer?";
                return response;
            } else if (product.stock < 5) {
                response += `⚠️ **Hurry!** Only ${product.stock} units left in stock!\n\n`;
            }
        }

        response += "Here's how to complete your order:\n\n";
        response += "1️⃣ **Confirm your items**\n";
        response += "2️⃣ **Choose payment method**:\n";

        if (businessConfig.businessInfo?.paymentMethods) {
            businessConfig.businessInfo.paymentMethods.forEach((method, index) => {
                response += `   ${index === 0 ? '💳' : '💰'} ${method}\n`;
            });
        }

        response += "3️⃣ **Provide delivery details**\n\n";
        response += `📞 Contact: ${businessConfig.businessInfo?.contactInfo?.phone || 'Message us here'}\n`;
        response += `⏰ Available: ${businessConfig.businessInfo?.businessHours || 'Daily'}\n\n`;
        response += "Ready to proceed? Just confirm and we'll process your order right away! 🚀";

        return response;
    }

    // Determine urgency level
    determineUrgency(analysis, leadScore) {
        // Safety check for analysis object
        if (!analysis || !analysis.urgencyIndicators) {
            return leadScore >= 25 ? 'high' : leadScore >= 15 ? 'medium' : 'low';
        }

        if (leadScore >= 25 || analysis.urgencyIndicators.length >= 2) {
            return 'high';
        } else if (leadScore >= 15 || analysis.urgencyIndicators.length >= 1) {
            return 'medium';
        }
        return 'low';
    }

    // Update conversation context
    updateConversationContext(customerId, message, response, analysis) {
        if (!this.conversationContext.has(customerId)) {
            this.conversationContext.set(customerId, {
                interactionCount: 0,
                topics: [],
                products: [],
                lastInteraction: null,
                totalLeadScore: 0,
                previousPurchase: false
            });
        }

        const context = this.conversationContext.get(customerId);
        context.interactionCount++;
        context.lastInteraction = new Date();
        context.totalLeadScore += analysis.leadScore || 0;

        // Track topics discussed
        if (analysis.intent && !context.topics.includes(analysis.intent)) {
            context.topics.push(analysis.intent);
        }

        this.conversationContext.set(customerId, context);
    }

    // Get conversation context
    getConversationContext(customerId) {
        return this.conversationContext.get(customerId) || {
            interactionCount: 0,
            topics: [],
            products: [],
            lastInteraction: null,
            totalLeadScore: 0,
            previousPurchase: false
        };
    }

    // Log interaction for AI learning
    async logInteractionForLearning(data) {
        try {
            const interaction = {
                customerId: data.customerId,
                customerName: data.customerName || 'Anonymous',
                message: data.message,
                botResponse: data.response,
                intent: data.analysis.intent,
                sentiment: data.analysis.sentiment,
                satisfactionScore: data.analysis.satisfactionScore || null,
                leadScore: data.leadScore,
                urgencyLevel: data.urgency,
                productsMentioned: data.mentionedProducts?.map(p => p.id) || [],
                topicsDiscussed: data.context.topics || [],
                conversationStage: this.determineConversationStage(data.analysis, data.context),
                sessionId: `session_${data.customerId}_${Date.now()}`
            };

            await this.db.logInteraction(interaction);

            // Log to spreadsheet if available
            if (typeof this.logToSpreadsheet === 'function') {
                await this.logToSpreadsheet(data);
            }

            // Learn from successful patterns
            if (data.analysis.confidence > 0.7) {
                await this.learnFromInteraction(data);
            }

        } catch (error) {
            console.error('❌ Error logging interaction for learning:', error);
        }
    }

    // Learn from successful interactions
    async learnFromInteraction(data) {
        try {
            const pattern = {
                type: data.analysis.intent,
                input: data.message.toLowerCase(),
                response: data.response,
                context: {
                    sentiment: data.analysis.sentiment,
                    leadScore: data.leadScore,
                    productsMentioned: data.mentionedProducts?.length || 0
                },
                successRate: data.analysis.confidence,
                usageCount: 1,
                confidenceScore: data.analysis.confidence
            };

            await this.db.saveAIPattern(pattern);
            console.log('🧠 AI learned new pattern:', data.analysis.intent);

        } catch (error) {
            console.error('❌ Error learning from interaction:', error);
        }
    }

    // Utility methods
    formatPrice(price) {
        return new Intl.NumberFormat('en-PH').format(price);
    }

    generateProductCategories(products) {
        const categories = [...new Set(products.map(p => p.category))];
        return categories.map(cat => `• ${cat}`).join('\n');
    }

    personalizeResponse(response, context, businessConfig) {
        // Add personalization based on customer context
        if (context.interactionCount > 3) {
            // Loyal customer treatment
            response = response.replace('!', '! As one of our valued customers,');
        }

        return response;
    }

    determineConversationStage(analysis, context) {
        if (context.interactionCount === 1) return 'initial';
        if (analysis.intent === 'purchase_intent') return 'closing';
        if (analysis.intent === 'product_inquiry') return 'discovery';
        if (analysis.intent === 'price_inquiry') return 'consideration';
        return 'engagement';
    }
}

// Sentiment Analysis Helper
class SentimentAnalyzer {
    analyze(message) {
        const positive = ['good', 'great', 'excellent', 'love', 'awesome', 'perfect', 'amazing', 'happy', 'satisfied'];
        const negative = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'angry', 'frustrated', 'problem'];

        const messageLower = message.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;

        positive.forEach(word => {
            if (messageLower.includes(word)) positiveScore++;
        });

        negative.forEach(word => {
            if (messageLower.includes(word)) negativeScore++;
        });

        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }
}

// Intent Classification Helper
class IntentClassifier {
    classify(message) {
        const messageLower = message.toLowerCase();

        const intents = {
            'greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
            'purchase_intent': ['buy', 'purchase', 'order', 'want to buy', 'i need', 'checkout', 'add to cart'],
            'price_inquiry': ['price', 'cost', 'how much', 'expense', 'rate', 'pricing'],
            'availability_check': ['available', 'stock', 'inventory', 'in stock', 'do you have'],
            'product_inquiry': ['tell me about', 'details', 'information', 'specs', 'features'],
            'support': ['help', 'support', 'problem', 'issue', 'question', 'assistance'],
            'comparison': ['compare', 'difference', 'vs', 'better', 'which one', 'alternative']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            for (const keyword of keywords) {
                if (messageLower.includes(keyword)) {
                    return intent;
                }
            }
        }

        return 'general';
    }

    // Log data to spreadsheet for external tracking
    async logToSpreadsheet(data) {
        try {
            if (!this.spreadsheetManager.isInitialized) {
                return; // Skip if spreadsheet not configured
            }

            // Extract customer information
            const customerInfo = await this.extractCustomerInfo(data.customerId, data.message);

            // Log lead data
            const leadData = {
                customerId: data.customerId,
                customerName: customerInfo.name || 'Anonymous',
                contactInfo: customerInfo.contact || '',
                leadScore: data.leadScore || 0,
                buyingStage: this.determineBuyingStage(data.analysis, data.context),
                interestLevel: this.determineInterestLevel(data.leadScore),
                priority: this.determinePriority(data.leadScore, data.analysis),
                tags: data.customerTags ? data.customerTags.map(tag => tag.tag).join(', ') : '',
                lastMessage: data.message,
                conversionStatus: data.orderStatus === 'completed' ? 'customer' : 'lead'
            };

            await this.spreadsheetManager.logLead(leadData);

            // Log order if this is an order interaction
            if (data.orderStatus && data.orderStatus !== 'inquiry') {
                const orderData = {
                    customerId: data.customerId,
                    customerName: customerInfo.name || 'Anonymous',
                    contactInfo: customerInfo.contact || '',
                    products: data.mentionedProducts ? data.mentionedProducts.map(p => p.name).join(', ') : '',
                    quantity: this.extractQuantityFromMessage(data.message),
                    totalAmount: data.orderTotal || '',
                    status: data.orderStatus,
                    priority: this.determinePriority(data.leadScore, data.analysis),
                    leadScore: data.leadScore || 0,
                    tags: data.customerTags ? data.customerTags.map(tag => tag.tag).join(', ') : ''
                };

                await this.spreadsheetManager.logOrder(orderData);
            }

        } catch (error) {
            console.error('❌ Error logging to spreadsheet:', error.message);
        }
    }

    // Extract customer information from message and context
    async extractCustomerInfo(customerId, message) {
        try {
            // Try to get customer info from database first
            const existingCustomer = await this.db.getCustomer(customerId);
            if (existingCustomer) {
                return {
                    name: existingCustomer.name,
                    contact: existingCustomer.phone || existingCustomer.email
                };
            }

            // Extract from message if not in database
            const info = this.extractContactInfoFromMessage(message);
            return info;

        } catch (error) {
            console.error('Error extracting customer info:', error);
            return { name: '', contact: '' };
        }
    }

    // Extract contact information from message text
    extractContactInfoFromMessage(message) {
        const info = { name: '', contact: '' };

        // Extract phone numbers
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phoneMatch = message.match(phoneRegex);
        if (phoneMatch) {
            info.contact = phoneMatch[0];
        }

        // Extract email addresses
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emailMatch = message.match(emailRegex);
        if (emailMatch) {
            info.contact = info.contact ? `${info.contact}, ${emailMatch[0]}` : emailMatch[0];
        }

        // Extract names (simple heuristic - words that start with capital letters)
        const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
        const nameMatch = message.match(nameRegex);
        if (nameMatch) {
            info.name = nameMatch[0];
        }

        return info;
    }

    // Extract quantity from order message
    extractQuantityFromMessage(message) {
        const quantityRegex = /(\d+)\s*(pieces?|pcs?|bottles?|units?|qty|quantity)/i;
        const match = message.match(quantityRegex);
        return match ? parseInt(match[1]) : 1;
    }

    // Determine buying stage for spreadsheet
    determineBuyingStage(analysis, context) {
        const intent = analysis.intent.toLowerCase();

        if (intent.includes('buy') || intent.includes('purchase') || intent.includes('order')) {
            return 'decision';
        } else if (intent.includes('price') || intent.includes('cost') || intent.includes('compare')) {
            return 'consideration';
        } else if (intent.includes('info') || intent.includes('learn') || intent.includes('question')) {
            return 'research';
        } else {
            return 'awareness';
        }
    }

    // Determine interest level based on lead score
    determineInterestLevel(leadScore) {
        if (leadScore >= 80) return 'very_high';
        if (leadScore >= 60) return 'high';
        if (leadScore >= 40) return 'medium';
        if (leadScore >= 20) return 'low';
        return 'very_low';
    }

    // Determine priority for spreadsheet
    determinePriority(leadScore, analysis) {
        if (leadScore >= 70 && analysis.confidence >= 0.8) return 'high';
        if (leadScore >= 50 && analysis.confidence >= 0.6) return 'medium';
        return 'low';
    }

    // === MISSING AI ANALYSIS METHODS ===

    // Extract entities from message
    extractEntities(message) {
        const entities = {
            products: [],
            quantities: [],
            prices: [],
            locations: [],
            names: [],
            contacts: []
        };

        const messageLower = message.toLowerCase();

        // Extract quantities (numbers)
        const quantityMatches = message.match(/\b(\d+)\s*(pieces?|pcs?|bottles?|units?|mga|piraso|bote)/gi);
        if (quantityMatches) {
            entities.quantities = quantityMatches.map(match => {
                const num = match.match(/\d+/)[0];
                return parseInt(num);
            });
        }

        // Extract prices/money
        const priceMatches = message.match(/\$\d+|\d+\s*(pesos?|php|dollars?)/gi);
        if (priceMatches) {
            entities.prices = priceMatches;
        }

        // Extract Filipino numbers
        const filipinoNumbers = {
            'isa': 1, 'dalawa': 2, 'tatlo': 3, 'apat': 4, 'lima': 5,
            'anim': 6, 'pito': 7, 'walo': 8, 'siyam': 9, 'sampu': 10
        };

        Object.entries(filipinoNumbers).forEach(([word, num]) => {
            if (messageLower.includes(word)) {
                entities.quantities.push(num);
            }
        });

        return entities;
    }

    // Detect urgency indicators
    detectUrgencyIndicators(message) {
        const messageLower = message.toLowerCase();

        const urgencyKeywords = {
            ultra_high: ['asap', 'emergency', 'right now', 'immediately', 'ngayon na', 'urgent na urgent'],
            high: ['urgent', 'today', 'now', 'quickly', 'fast', 'rush', 'kailangan ko na', 'ngayon po'],
            medium: ['soon', 'this week', 'tomorrow', 'bukas', 'malapit na', 'maya'],
            low: ['sometime', 'eventually', 'maybe', 'siguro', 'baka', 'minsan']
        };

        for (const [level, keywords] of Object.entries(urgencyKeywords)) {
            for (const keyword of keywords) {
                if (messageLower.includes(keyword)) {
                    return { level, detected: keyword };
                }
            }
        }

        return { level: 'none', detected: null };
    }

    // Detect buying signals
    detectBuyingSignals(message) {
        const messageLower = message.toLowerCase();

        const buyingSignals = {
            purchase_intent: ['buy', 'purchase', 'order', 'bumili', 'bili', 'kumuha', 'order'],
            price_inquiry: ['cost', 'price', 'how much', 'magkano', 'presyo', 'bayad'],
            readiness: ['ready', 'cash', 'money', 'pay', 'bayad', 'pera', 'handa na'],
            comparison: ['compare', 'better', 'cheaper', 'mas mura', 'mas maganda'],
            urgency: ['need', 'want', 'must have', 'kailangan', 'gusto', 'dapat']
        };

        const detected = [];
        for (const [signal, keywords] of Object.entries(buyingSignals)) {
            for (const keyword of keywords) {
                if (messageLower.includes(keyword)) {
                    detected.push({ signal, keyword });
                }
            }
        }

        return detected;
    }

    // Extract contact information
    extractContactInfo(message) {
        const info = {
            phones: [],
            emails: [],
            names: []
        };

        // Extract phone numbers
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = message.match(phoneRegex);
        if (phones) {
            info.phones = phones;
        }

        // Extract email addresses
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = message.match(emailRegex);
        if (emails) {
            info.emails = emails;
        }

        // Extract potential names (simple heuristic)
        const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
        const names = message.match(nameRegex);
        if (names) {
            info.names = names;
        }

        return info;
    }

    // Extract order details
    extractOrderDetails(message) {
        const details = {
            quantities: [],
            products: [],
            specifications: [],
            preferences: []
        };

        const messageLower = message.toLowerCase();

        // Extract quantities with context
        const quantityContext = [
            { pattern: /(\d+)\s*(bottles?|bote)/gi, type: 'bottles' },
            { pattern: /(\d+)\s*(pieces?|piraso)/gi, type: 'pieces' },
            { pattern: /(\d+)\s*(sets?)/gi, type: 'sets' },
            { pattern: /(dalawa|tatlo|apat|lima)\s*(bote|piraso)/gi, type: 'filipino_quantity' }
        ];

        quantityContext.forEach(({ pattern, type }) => {
            const matches = message.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    details.quantities.push({ text: match, type });
                });
            }
        });

        // Extract size preferences
        const sizeKeywords = ['small', 'medium', 'large', 'maliit', 'malaki', 'katamtaman'];
        sizeKeywords.forEach(size => {
            if (messageLower.includes(size)) {
                details.specifications.push({ type: 'size', value: size });
            }
        });

        return details;
    }

    // Calculate confidence score
    calculateConfidence(message) {
        let confidence = 0.5; // Base confidence

        const messageLower = message.toLowerCase();

        // Increase confidence for clear intent
        const clearIntents = ['buy', 'purchase', 'order', 'bumili', 'magkano', 'how much'];
        clearIntents.forEach(intent => {
            if (messageLower.includes(intent)) {
                confidence += 0.2;
            }
        });

        // Increase confidence for specific products
        if (messageLower.includes('oil') || messageLower.includes('lavender')) {
            confidence += 0.1;
        }

        // Increase confidence for quantities
        if (/\d+/.test(message) || messageLower.includes('dalawa') || messageLower.includes('tatlo')) {
            confidence += 0.15;
        }

        // Increase confidence for urgency
        if (messageLower.includes('urgent') || messageLower.includes('now') || messageLower.includes('ngayon')) {
            confidence += 0.1;
        }

        // Decrease confidence for vague messages
        if (message.length < 10) {
            confidence -= 0.2;
        }

        return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
    }
}

// Response Optimization Helper
class ResponseOptimizer {
    constructor() {
        this.responseMetrics = new Map();
    }

    optimizeResponse(baseResponse, context) {
        // Future implementation for A/B testing responses
        return baseResponse;
    }
}

module.exports = AIIntelligence;