// Bot response logic for Shopee chat integration

class ShopeeBot {
  constructor(shopName = 'Our Shop') {
    this.shopName = shopName;
    this.responses = this.initializeResponses();
  }

  initializeResponses() {
    return {
      greeting: [
        'hello', 'hi', 'kumusta', 'good morning', 'good afternoon', 'good evening'
      ],
      pricing: [
        'price', 'magkano', 'cost', 'how much', 'presyo'
      ],
      availability: [
        'available', 'stock', 'meron', 'in stock', 'may stock'
      ],
      shipping: [
        'shipping', 'delivery', 'ship', 'deliver', 'send'
      ]
    };
  }

  processMessage(message, userName = 'there') {
    if (!message || typeof message !== 'string') {
      return this.getDefaultResponse(userName);
    }

    const lowerMessage = message.toLowerCase().trim();

    // Check for availability inquiries first (more specific)
    if (this.containsKeywords(lowerMessage, this.responses.availability)) {
      return `Hello ${userName}! Yes, I can check product availability for you. Which item would you like to know about? 📦`;
    }

    // Check for pricing inquiries
    if (this.containsKeywords(lowerMessage, this.responses.pricing)) {
      return `Hi ${userName}! I'd be happy to help you with pricing information. What specific product are you interested in? 💰`;
    }

    // Check for shipping inquiries
    if (this.containsKeywords(lowerMessage, this.responses.shipping)) {
      return `Hi ${userName}! We offer various shipping options. Where would you like your order delivered? 🚚`;
    }

    // Check for greeting (last to avoid conflicts)
    if (this.containsKeywords(lowerMessage, this.responses.greeting)) {
      return `Hello ${userName}! Welcome to ${this.shopName}! 👋 How can I help you today?`;
    }

    // Default response for unrecognized messages
    return this.getDefaultResponse(userName);
  }

  containsKeywords(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  getDefaultResponse(userName) {
    return `Hello ${userName}! Thank you for your message. I'm here to help you with any questions about our products, pricing, availability, or shipping. What would you like to know? 😊`;
  }

  // Log potential customer interaction for follow-up
  logCustomerInteraction(userName, message, response) {
    const interaction = {
      timestamp: new Date().toISOString(),
      customer: userName,
      message: message,
      botResponse: response,
      category: this.categorizeMessage(message),
      potentialBuyer: this.assessBuyingIntent(message)
    };

    console.log('Customer Interaction:', interaction);
    return interaction;
  }

  categorizeMessage(message) {
    const lowerMessage = message.toLowerCase();

    if (this.containsKeywords(lowerMessage, this.responses.greeting)) return 'greeting';
    if (this.containsKeywords(lowerMessage, this.responses.pricing)) return 'pricing';
    if (this.containsKeywords(lowerMessage, this.responses.availability)) return 'availability';
    if (this.containsKeywords(lowerMessage, this.responses.shipping)) return 'shipping';

    return 'general';
  }

  assessBuyingIntent(message) {
    const buyingKeywords = [
      'buy', 'purchase', 'order', 'bili', 'kumuha', 'checkout', 'cart', 'payment'
    ];

    const lowerMessage = message.toLowerCase();
    return buyingKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

module.exports = ShopeeBot;