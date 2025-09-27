// Intelligent AI Engine for SaaS Bot
// Provides smart responses based on seller's business data

class AIEngine {
  constructor(businessData = {}) {
    this.businessData = {
      shopName: businessData.shopName || 'Our Shop',
      products: businessData.products || [],
      services: businessData.services || [],
      businessInfo: businessData.businessInfo || {},
      faqs: businessData.faqs || [],
      salesScripts: businessData.salesScripts || {},
      ...businessData
    };

    this.conversationContext = new Map(); // Store user conversation history
    this.leadScores = new Map(); // Track customer engagement scores
  }

  // Main intelligent response processor
  async processIntelligentMessage(message, userId, userName = 'there') {
    try {
      // Get or create conversation context
      const context = this.getConversationContext(userId);

      // Analyze customer intent
      const intent = this.analyzeIntent(message, context);

      // Update lead score based on engagement
      this.updateLeadScore(userId, intent, message);

      // Generate intelligent response
      const response = await this.generateIntelligentResponse(intent, message, userName, context);

      // Update conversation context
      this.updateConversationContext(userId, message, response, intent);

      return {
        response: response.text,
        quickReplies: response.quickReplies || [],
        leadData: this.getLeadData(userId),
        shouldCaptureLead: this.shouldCaptureLead(userId),
        suggestedFollowUp: this.getSuggestedFollowUp(userId)
      };

    } catch (error) {
      console.error('AI Engine error:', error);
      return {
        response: `Hello ${userName}! I'm here to help you learn about our products. What can I assist you with?`,
        quickReplies: this.getDefaultQuickReplies()
      };
    }
  }

  // Analyze customer intent using AI-like logic
  analyzeIntent(message, context) {
    const lowerMessage = message.toLowerCase();

    // Call request - handle immediately
    if (this.containsAny(lowerMessage, [
      'call me', 'can you call', 'phone me', 'tawag', 'call you', 'talk to you'
    ])) {
      return { type: 'call_request', confidence: 0.9, urgency: 'high' };
    }

    // Immediate purchase intent - highest priority
    if (this.containsAny(lowerMessage, [
      'buy now', 'order now', 'purchase now', 'checkout', 'add to cart',
      'bili na', 'kumuha na', 'order ko na', 'ready to buy'
    ])) {
      return { type: 'ready_to_purchase', confidence: 1.0, urgency: 'immediate' };
    }

    // High-intent buying signals
    if (this.containsAny(lowerMessage, [
      'buy', 'purchase', 'order', 'payment', 'pay',
      'bili', 'kumuha', 'how to buy', 'paano bumili'
    ])) {
      return { type: 'buying', confidence: 0.9, urgency: 'high' };
    }

    // Price comparison (medium intent)
    if (this.containsAny(lowerMessage, [
      'price', 'cost', 'magkano', 'how much', 'presyo', 'compare price'
    ])) {
      return { type: 'pricing', confidence: 0.7, urgency: 'medium' };
    }

    // Product inquiry (medium-high intent)
    if (this.containsAny(lowerMessage, [
      'available', 'stock', 'meron', 'specs', 'specification', 'details'
    ])) {
      return { type: 'product_inquiry', confidence: 0.8, urgency: 'medium' };
    }

    // Shipping inquiry (medium intent)
    if (this.containsAny(lowerMessage, [
      'shipping', 'delivery', 'ship', 'deliver', 'location'
    ])) {
      return { type: 'shipping', confidence: 0.6, urgency: 'medium' };
    }

    // Greeting or browsing (low intent)
    if (this.containsAny(lowerMessage, [
      'hello', 'hi', 'kumusta', 'good morning', 'browse', 'look around'
    ])) {
      return { type: 'greeting', confidence: 0.3, urgency: 'low' };
    }

    // Default - trying to understand
    return { type: 'general', confidence: 0.4, urgency: 'low' };
  }

  // Generate intelligent, contextual responses
  async generateIntelligentResponse(intent, message, userName, context) {
    const shopName = this.businessData.shopName;

    switch (intent.type) {
      case 'ready_to_purchase':
        return this.generatePurchaseHandoffResponse(message, userName, context);

      case 'call_request':
        return this.generateCallResponse(message, userName, context);

      case 'buying':
        return this.generateBuyingResponse(message, userName, context);

      case 'pricing':
        return this.generatePricingResponse(message, userName, context);

      case 'product_inquiry':
        return this.generateProductResponse(message, userName, context);

      case 'shipping':
        return this.generateShippingResponse(userName, context);

      case 'greeting':
        return this.generateGreetingResponse(userName, context);

      default:
        return this.generateHelpfulResponse(message, userName, context);
    }
  }

  generatePurchaseHandoffResponse(message, userName, context) {
    const shopName = this.businessData.shopName;
    const businessInfo = this.businessData.businessInfo;
    const mentionedProduct = this.findMentionedProduct(message);

    let productInfo = '';
    if (mentionedProduct) {
      productInfo = ` for the ${mentionedProduct.name} (₱${mentionedProduct.price})`;
    }

    const responses = [
      `Perfect, ${userName}! I'm connecting you with our sales team to complete your order${productInfo}. 🛒`,
      `Excellent choice, ${userName}! Let me connect you with our seller to finalize your purchase${productInfo}. ✨`,
      `Great! I'm transferring you to our sales specialist to process your order${productInfo}. 🎯`
    ];

    return {
      text: this.selectResponse(responses) + ` You can also:

📞 **Call us directly**: ${businessInfo.businessHours || 'Mon-Sat 9AM-6PM'}
💬 **Continue here**: I'll connect you with a live agent
📱 **Visit our page**: Check our full catalog

**Ready to proceed with your order?**`,
      quickReplies: [
        { title: '🛒 Complete Order', payload: 'COMPLETE_ORDER' },
        { title: '👨‍💼 Talk to Agent', payload: 'HUMAN_AGENT' },
        { title: '📞 Get Phone Number', payload: 'GET_PHONE' },
        { title: '📱 View Page', payload: 'VIEW_PAGE' }
      ]
    };
  }

  generateCallResponse(message, userName, context) {
    const businessInfo = this.businessData.businessInfo;
    const businessHours = businessInfo.businessHours || 'Mon-Sat 9AM-6PM';

    // Natural responses for call requests
    const responses = [
      `I appreciate that, ${userName}! I'm actually a virtual assistant, so I can't make phone calls. But I'm here to help you with everything you need! 😊`,
      `Thanks for asking, ${userName}! I'm a digital assistant, so I can't call you directly. But I can connect you with our team or answer any questions right here! 💬`,
      `I'd love to help, ${userName}! I'm an AI assistant, so I can't make calls, but I can provide all the information you need right here. What would you like to know? 🤖`
    ];

    return {
      text: this.selectResponse(responses) + ` Our business hours are ${businessHours} if you'd like to call us directly.`,
      quickReplies: [
        { title: '📞 Get Phone Number', payload: 'GET_PHONE' },
        { title: '💬 Continue Chat', payload: 'CONTINUE_CHAT' },
        { title: '📧 Email Us', payload: 'EMAIL_CONTACT' },
        { title: '📱 View Products', payload: 'VIEW_PRODUCTS' }
      ]
    };
  }

  generateBuyingResponse(message, userName, context) {
    // Check if this is a follow-up to avoid repetitive greetings
    const visitCount = context.interactions.length;

    let responseText;
    if (visitCount === 0) {
      const responses = [
        `Excellent, ${userName}! I'm excited to help you with your purchase. 🛒`,
        `Great choice, ${userName}! Let me guide you through our ordering process. ✨`,
        `Perfect timing, ${userName}! I can help you place your order right now. 🎯`
      ];
      responseText = this.selectResponse(responses) + " What specific product interests you most?";
    } else {
      const followUpResponses = [
        "Perfect! What specific product are you interested in?",
        "Great! Which item would you like to order?",
        "Excellent! What can I help you purchase today?",
        "Sure thing! What product catches your eye?"
      ];
      responseText = this.selectResponse(followUpResponses);
    }

    return {
      text: responseText,
      quickReplies: [
        { title: '📱 iPhones', payload: 'IPHONES' },
        { title: '💻 Laptops', payload: 'LAPTOPS' },
        { title: '🎧 Audio', payload: 'AUDIO' },
        { title: '📞 Call Info', payload: 'REQUEST_CALL' }
      ]
    };
  }

  generatePricingResponse(message, userName, context) {
    // Try to match specific products mentioned
    const mentionedProduct = this.findMentionedProduct(message);

    if (mentionedProduct) {
      return {
        text: `Hi ${userName}! Our ${mentionedProduct.name} is priced at ₱${mentionedProduct.price}. ${mentionedProduct.description} Would you like to know more details? 💰`,
        quickReplies: [
          { title: '📦 Check Stock', payload: `STOCK_${mentionedProduct.id}` },
          { title: '🚚 Shipping Cost', payload: 'SHIPPING' },
          { title: '🛒 Order Now', payload: `BUY_${mentionedProduct.id}` }
        ]
      };
    }

    return {
      text: `Hi ${userName}! I'd love to give you exact pricing. Which product are you interested in? Our prices are very competitive! 💰`,
      quickReplies: this.getProductQuickReplies()
    };
  }

  generateProductResponse(message, userName, context) {
    const mentionedProduct = this.findMentionedProduct(message);

    if (mentionedProduct) {
      const stockStatus = mentionedProduct.stock > 0 ? `Yes, we have ${mentionedProduct.stock} units available! ✅` : 'Currently out of stock, but we can pre-order for you! 📋';

      return {
        text: `${userName}, regarding our ${mentionedProduct.name}: ${stockStatus} Price: ₱${mentionedProduct.price}. ${mentionedProduct.description}`,
        quickReplies: [
          { title: '🛒 Order Now', payload: `BUY_${mentionedProduct.id}` },
          { title: '💬 More Info', payload: `INFO_${mentionedProduct.id}` },
          { title: '📞 Call Me', payload: 'REQUEST_CALL' }
        ]
      };
    }

    return {
      text: `Hi ${userName}! I can check availability for any of our products. Which item interests you? 📦`,
      quickReplies: this.getProductQuickReplies()
    };
  }

  generateShippingResponse(userName, context) {
    const businessInfo = this.businessData.businessInfo;
    const location = businessInfo.location || 'Metro Manila';
    const shippingFee = businessInfo.shippingFee || '₱50-150';

    return {
      text: `Hi ${userName}! We ship nationwide from ${location}. Shipping fee: ${shippingFee} depending on location. Free shipping for orders ₱1000+! 🚚 Where would you like it delivered?`,
      quickReplies: [
        { title: '📍 Calculate Shipping', payload: 'CALC_SHIPPING' },
        { title: '🛒 Order & Ship', payload: 'ORDER_NOW' },
        { title: '📞 Discuss Delivery', payload: 'REQUEST_CALL' }
      ]
    };
  }

  generateGreetingResponse(userName, context) {
    const shopName = this.businessData.shopName;
    const visitCount = context.interactions.length;

    // Only greet on first interaction, then be more conversational
    if (visitCount === 0) {
      return {
        text: `Hello ${userName}! Welcome to ${shopName}! 👋 I'm here to help you find exactly what you need. What brings you here today?`,
        quickReplies: this.getMainMenuQuickReplies()
      };
    }

    // For returning customers, be more natural
    const casualResponses = [
      `Sure thing! What can I help you with?`,
      `Of course! What are you looking for today?`,
      `Absolutely! How can I assist you?`,
      `Great! What would you like to know?`
    ];

    return {
      text: this.selectResponse(casualResponses),
      quickReplies: this.getMainMenuQuickReplies()
    };
  }

  generateHelpfulResponse(message, userName, context) {
    // Try to find relevant FAQ
    const relevantFaq = this.findRelevantFaq(message);

    if (relevantFaq) {
      return {
        text: `${userName}, ${relevantFaq.answer} Is there anything else you'd like to know? 😊`,
        quickReplies: this.getMainMenuQuickReplies()
      };
    }

    return {
      text: `Thank you for your message, ${userName}! I'd love to help you better. Could you tell me what specific product or service you're interested in? 🤔`,
      quickReplies: this.getMainMenuQuickReplies()
    };
  }

  // Lead scoring and qualification
  updateLeadScore(userId, intent, message) {
    let currentScore = this.leadScores.get(userId) || 0;

    // Score based on intent
    const intentScores = {
      'buying': 25,
      'pricing': 15,
      'product_inquiry': 10,
      'shipping': 8,
      'greeting': 2
    };

    currentScore += intentScores[intent.type] || 5;

    // Bonus for engagement patterns
    if (message.length > 20) currentScore += 3; // Detailed messages
    if (this.containsAny(message.toLowerCase(), ['urgent', 'asap', 'today', 'now'])) currentScore += 10;
    if (this.containsAny(message.toLowerCase(), ['budget', 'afford', 'cheap'])) currentScore += 5;

    this.leadScores.set(userId, Math.min(currentScore, 100));
  }

  shouldCaptureLead(userId) {
    const score = this.leadScores.get(userId) || 0;
    const context = this.getConversationContext(userId);
    const interactionCount = context.interactions.length;

    // Capture if high score OR multiple interactions
    return score >= 30 || interactionCount >= 3;
  }

  getLeadData(userId) {
    const context = this.getConversationContext(userId);
    const score = this.leadScores.get(userId) || 0;

    return {
      userId,
      score,
      interactionCount: context.interactions.length,
      firstContact: context.firstContact,
      lastInteraction: context.lastInteraction,
      interests: context.interests,
      urgencyLevel: score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low',
      estimatedValue: this.estimateCustomerValue(context)
    };
  }

  // Helper methods
  getConversationContext(userId) {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, {
        firstContact: new Date().toISOString(),
        interactions: [],
        interests: [],
        preferences: {}
      });
    }
    return this.conversationContext.get(userId);
  }

  updateConversationContext(userId, message, response, intent) {
    const context = this.getConversationContext(userId);
    context.lastInteraction = new Date().toISOString();
    context.interactions.push({
      timestamp: new Date().toISOString(),
      message,
      response: response.text,
      intent: intent.type
    });

    // Track interests
    const product = this.findMentionedProduct(message);
    if (product && !context.interests.includes(product.name)) {
      context.interests.push(product.name);
    }
  }

  findMentionedProduct(message) {
    const lowerMessage = message.toLowerCase();
    return this.businessData.products.find(product =>
      lowerMessage.includes(product.name.toLowerCase()) ||
      (product.keywords && product.keywords.some(keyword =>
        lowerMessage.includes(keyword.toLowerCase())
      ))
    );
  }

  findRelevantFaq(message) {
    const lowerMessage = message.toLowerCase();
    return this.businessData.faqs.find(faq =>
      faq.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))
    );
  }

  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  selectResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getProductQuickReplies() {
    return this.businessData.products.slice(0, 3).map(product => ({
      title: `${product.name} ₱${product.price}`,
      payload: `PRODUCT_${product.id}`
    }));
  }

  getMainMenuQuickReplies() {
    return [
      { title: '📱 View Products', payload: 'VIEW_PRODUCTS' },
      { title: '💰 Check Prices', payload: 'PRICING' },
      { title: '📦 Check Stock', payload: 'AVAILABILITY' },
      { title: '🚚 Shipping Info', payload: 'SHIPPING' }
    ];
  }

  getDefaultQuickReplies() {
    return [
      { title: '💬 I need help', payload: 'HELP' },
      { title: '📞 Contact seller', payload: 'CONTACT' }
    ];
  }

  estimateCustomerValue(context) {
    const interactionCount = context.interactions.length;
    const interests = context.interests.length;

    if (interactionCount >= 5 && interests >= 2) return 'high';
    if (interactionCount >= 3 || interests >= 1) return 'medium';
    return 'low';
  }

  getSuggestedFollowUp(userId) {
    const leadData = this.getLeadData(userId);
    const context = this.getConversationContext(userId);

    if (leadData.score >= 50) {
      return {
        priority: 'urgent',
        action: 'call_immediately',
        message: 'High-intent customer - call within 1 hour',
        suggestedScript: 'Hi! I saw you were interested in our products. I have a special offer that might interest you...'
      };
    }

    if (leadData.score >= 25) {
      return {
        priority: 'medium',
        action: 'follow_up_today',
        message: 'Interested customer - follow up today',
        suggestedScript: 'Hi! Thanks for your interest. Do you have any questions I can help with?'
      };
    }

    return {
      priority: 'low',
      action: 'nurture',
      message: 'Add to nurture campaign',
      suggestedScript: 'Thanks for checking us out! Here are some product updates...'
    };
  }
}

module.exports = AIEngine;