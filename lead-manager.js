// Lead Management and Google Sheets Integration
// Intelligently captures and organizes customer leads

class LeadManager {
  constructor(config = {}) {
    this.config = {
      spreadsheetId: config.spreadsheetId || null,
      worksheetName: config.worksheetName || 'Leads',
      autoCapture: config.autoCapture !== false, // Default true
      scoreThreshold: config.scoreThreshold || 25,
      ...config
    };

    this.leads = new Map();
    this.conversationHistory = new Map();
  }

  // Main method to process and potentially capture a lead
  async processLead(userId, userData, aiResponse) {
    try {
      // Update conversation tracking
      this.updateConversationHistory(userId, userData);

      // Analyze if this should be captured as a lead
      const leadAnalysis = this.analyzeLead(userId, userData, aiResponse);

      if (leadAnalysis.shouldCapture) {
        const leadData = await this.captureLead(userId, userData, leadAnalysis);

        // Auto-save to Google Sheets if configured
        if (this.config.spreadsheetId && this.config.autoCapture) {
          await this.saveToGoogleSheets(leadData);
        }

        return {
          leadCaptured: true,
          leadData,
          recommendation: this.getFollowUpRecommendation(leadData)
        };
      }

      return {
        leadCaptured: false,
        potentialLead: leadAnalysis,
        nextSteps: this.getNextSteps(userId, leadAnalysis)
      };

    } catch (error) {
      console.error('Lead processing error:', error);
      return { error: 'Failed to process lead' };
    }
  }

  // Intelligent lead analysis
  analyzeLead(userId, userData, aiResponse) {
    const conversation = this.conversationHistory.get(userId) || { messages: [], score: 0 };
    const currentMessage = userData.message.toLowerCase();

    // Calculate engagement score
    let score = conversation.score || 0;

    // High-value indicators
    const highValueKeywords = [
      'buy', 'purchase', 'order', 'checkout', 'payment', 'pay now',
      'bili', 'kumuha', 'magkano total', 'paano mag order'
    ];

    const mediumValueKeywords = [
      'price', 'cost', 'magkano', 'available', 'stock', 'delivery',
      'specs', 'warranty', 'compare', 'difference'
    ];

    const urgencyKeywords = [
      'today', 'now', 'asap', 'urgent', 'need immediately', 'ngayon'
    ];

    const contactKeywords = [
      'call me', 'contact', 'phone', 'number', 'email', 'address'
    ];

    // Score calculation
    if (this.containsAny(currentMessage, highValueKeywords)) score += 25;
    if (this.containsAny(currentMessage, mediumValueKeywords)) score += 15;
    if (this.containsAny(currentMessage, urgencyKeywords)) score += 15;
    if (this.containsAny(currentMessage, contactKeywords)) score += 20;

    // Engagement patterns
    if (conversation.messages.length >= 3) score += 10; // Multiple interactions
    if (currentMessage.length > 30) score += 5; // Detailed messages
    if (this.hasContactInfo(currentMessage)) score += 30; // Provided contact info

    // Business hours bonus (more serious during business hours)
    if (this.isBusinessHours()) score += 5;

    // Return analysis
    return {
      score: Math.min(score, 100),
      shouldCapture: score >= this.config.scoreThreshold,
      urgencyLevel: score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low',
      indicators: {
        hasHighValueKeywords: this.containsAny(currentMessage, highValueKeywords),
        hasMediumValueKeywords: this.containsAny(currentMessage, mediumValueKeywords),
        isUrgent: this.containsAny(currentMessage, urgencyKeywords),
        wantsContact: this.containsAny(currentMessage, contactKeywords),
        hasContactInfo: this.hasContactInfo(currentMessage),
        multipleInteractions: conversation.messages.length >= 3
      },
      confidence: this.calculateConfidence(score, conversation.messages.length)
    };
  }

  // Capture lead with intelligent data extraction
  async captureLead(userId, userData, analysis) {
    const conversation = this.conversationHistory.get(userId);
    const extractedInfo = this.extractContactInfo(conversation.messages);

    const leadData = {
      // Basic info
      id: this.generateLeadId(),
      userId: userId,
      name: userData.userName || extractedInfo.name || 'Unknown',
      source: 'Facebook Messenger',
      capturedAt: new Date().toISOString(),

      // Conversation context
      firstContact: conversation.firstMessage || new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      totalInteractions: conversation.messages.length,

      // Extracted contact information
      phone: extractedInfo.phone || '',
      email: extractedInfo.email || '',
      location: extractedInfo.location || '',

      // Interest analysis
      interests: this.extractInterests(conversation.messages),
      interestedProducts: this.extractMentionedProducts(conversation.messages),
      priceRange: this.extractPriceRange(conversation.messages),

      // Lead scoring
      score: analysis.score,
      urgencyLevel: analysis.urgencyLevel,
      confidence: analysis.confidence,

      // Business intelligence
      estimatedValue: this.estimateCustomerValue(conversation.messages, analysis),
      buyingStage: this.identifyBuyingStage(conversation.messages),
      objections: this.identifyObjections(conversation.messages),

      // Follow-up info
      bestTimeToContact: this.determineBestContactTime(conversation.messages),
      preferredContactMethod: this.determinePreferredContact(conversation.messages),

      // Full conversation for context
      conversationSummary: this.generateConversationSummary(conversation.messages),
      lastMessage: userData.message,

      // Status tracking
      status: 'new',
      followUpScheduled: false,
      notes: ''
    };

    // Store the lead
    this.leads.set(leadData.id, leadData);

    return leadData;
  }

  // Extract contact information from conversation
  extractContactInfo(messages) {
    const fullText = messages.map(m => m.content).join(' ').toLowerCase();

    const info = {
      phone: this.extractPhone(fullText),
      email: this.extractEmail(fullText),
      name: this.extractName(messages),
      location: this.extractLocation(fullText)
    };

    return info;
  }

  extractPhone(text) {
    // Philippine phone number patterns
    const phonePatterns = [
      /(\+63|0)9\d{9}/g,          // +639xxxxxxxxx or 09xxxxxxxxx
      /(\+63|0)\d{10}/g,          // +63xxxxxxxxxx or 0xxxxxxxxxx
      /09\d{2}[-\s]?\d{3}[-\s]?\d{4}/g  // 09xx-xxx-xxxx format
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return null;
  }

  extractEmail(text) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = text.match(emailPattern);
    return match ? match[0] : null;
  }

  extractName(messages) {
    // Look for "my name is", "i'm", etc.
    const namePatterns = [
      /my name is ([a-zA-Z\s]+)/i,
      /i'm ([a-zA-Z\s]+)/i,
      /ako si ([a-zA-Z\s]+)/i
    ];

    for (const message of messages) {
      for (const pattern of namePatterns) {
        const match = message.content.match(pattern);
        if (match) return match[1].trim();
      }
    }
    return null;
  }

  extractLocation(text) {
    // Common Philippine locations
    const locations = [
      'manila', 'quezon city', 'makati', 'cebu', 'davao', 'taguig', 'pasig',
      'caloocan', 'marikina', 'parañaque', 'las piñas', 'antipolo',
      'metro manila', 'ncr', 'luzon', 'visayas', 'mindanao'
    ];

    for (const location of locations) {
      if (text.includes(location)) {
        return location.charAt(0).toUpperCase() + location.slice(1);
      }
    }
    return null;
  }

  // Business intelligence extraction
  extractInterests(messages) {
    const interests = [];
    const interestKeywords = {
      'Budget-conscious': ['cheap', 'affordable', 'budget', 'lowest price', 'discount'],
      'Quality-focused': ['quality', 'durable', 'warranty', 'brand', 'specifications'],
      'Tech-savvy': ['specs', 'features', 'latest', 'technology', 'performance'],
      'Urgent buyer': ['need now', 'today', 'asap', 'urgent', 'immediately']
    };

    const fullText = messages.map(m => m.content).join(' ').toLowerCase();

    for (const [interest, keywords] of Object.entries(interestKeywords)) {
      if (this.containsAny(fullText, keywords)) {
        interests.push(interest);
      }
    }

    return interests;
  }

  extractMentionedProducts(messages) {
    // This would integrate with the business config to find mentioned products
    const products = [];
    const fullText = messages.map(m => m.content).join(' ').toLowerCase();

    // Common product keywords
    const productKeywords = [
      'iphone', 'samsung', 'laptop', 'phone', 'computer', 'tablet',
      'airpods', 'headphones', 'speaker', 'camera', 'gaming'
    ];

    for (const keyword of productKeywords) {
      if (fullText.includes(keyword)) {
        products.push(keyword);
      }
    }

    return [...new Set(products)]; // Remove duplicates
  }

  extractPriceRange(messages) {
    const fullText = messages.map(m => m.content).join(' ');

    // Look for price mentions
    const pricePattern = /₱?(\d{1,3}(?:,\d{3})*|\d+)(?:\s*(?:pesos?|php|₱))?/gi;
    const prices = [];

    let match;
    while ((match = pricePattern.exec(fullText)) !== null) {
      const price = parseInt(match[1].replace(/,/g, ''));
      if (price >= 100 && price <= 1000000) { // Reasonable range
        prices.push(price);
      }
    }

    if (prices.length > 0) {
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        mentioned: prices
      };
    }

    return null;
  }

  identifyBuyingStage(messages) {
    const fullText = messages.map(m => m.content).join(' ').toLowerCase();

    if (this.containsAny(fullText, ['buy', 'purchase', 'order', 'checkout', 'pay'])) {
      return 'ready_to_buy';
    }

    if (this.containsAny(fullText, ['compare', 'vs', 'difference', 'which is better'])) {
      return 'comparing_options';
    }

    if (this.containsAny(fullText, ['price', 'cost', 'magkano', 'how much'])) {
      return 'evaluating_price';
    }

    if (this.containsAny(fullText, ['specs', 'features', 'details', 'about'])) {
      return 'researching';
    }

    return 'browsing';
  }

  identifyObjections(messages) {
    const objections = [];
    const fullText = messages.map(m => m.content).join(' ').toLowerCase();

    const objectionPatterns = {
      'price': ['too expensive', 'mahal', 'costly', 'pricey', 'afford'],
      'timing': ['maybe later', 'next month', 'thinking about it', 'not ready'],
      'trust': ['legit', 'authentic', 'scam', 'fake', 'original'],
      'comparison': ['compare first', 'check other', 'other options'],
      'budget': ['no budget', 'broke', 'tight budget', 'saving up']
    };

    for (const [objection, keywords] of Object.entries(objectionPatterns)) {
      if (this.containsAny(fullText, keywords)) {
        objections.push(objection);
      }
    }

    return objections;
  }

  // Google Sheets integration
  async saveToGoogleSheets(leadData) {
    try {
      // This would integrate with Google Sheets API
      // For now, we'll prepare the data structure
      const sheetRow = this.prepareSheetData(leadData);

      console.log('Saving to Google Sheets:', sheetRow);

      // TODO: Implement actual Google Sheets API call
      // const sheets = google.sheets({ version: 'v4', auth });
      // await sheets.spreadsheets.values.append({
      //   spreadsheetId: this.config.spreadsheetId,
      //   range: `${this.config.worksheetName}!A:Z`,
      //   valueInputOption: 'USER_ENTERED',
      //   requestBody: { values: [sheetRow] }
      // });

      return { success: true, data: sheetRow };
    } catch (error) {
      console.error('Google Sheets save error:', error);
      return { success: false, error: error.message };
    }
  }

  prepareSheetData(leadData) {
    return [
      leadData.capturedAt,
      leadData.name,
      leadData.phone || 'Not provided',
      leadData.email || 'Not provided',
      leadData.location || 'Not provided',
      leadData.score,
      leadData.urgencyLevel,
      leadData.estimatedValue,
      leadData.buyingStage,
      leadData.interestedProducts.join(', '),
      leadData.conversationSummary,
      leadData.bestTimeToContact,
      leadData.status,
      leadData.source
    ];
  }

  // Helper methods
  updateConversationHistory(userId, userData) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, {
        firstMessage: new Date().toISOString(),
        messages: []
      });
    }

    const conversation = this.conversationHistory.get(userId);
    conversation.messages.push({
      timestamp: new Date().toISOString(),
      content: userData.message,
      userName: userData.userName
    });
  }

  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  hasContactInfo(message) {
    return this.extractPhone(message) || this.extractEmail(message);
  }

  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Monday-Saturday 9AM-6PM
    return day >= 1 && day <= 6 && hour >= 9 && hour <= 18;
  }

  calculateConfidence(score, interactionCount) {
    let confidence = score / 100;

    // Boost confidence with more interactions
    if (interactionCount >= 3) confidence += 0.1;
    if (interactionCount >= 5) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  estimateCustomerValue(messages, analysis) {
    if (analysis.score >= 70) return 'high';
    if (analysis.score >= 40) return 'medium';
    return 'low';
  }

  determineBestContactTime(messages) {
    // Analyze when customer is most active
    const hours = messages.map(m => new Date(m.timestamp).getHours());
    const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;

    if (avgHour >= 9 && avgHour <= 12) return 'morning';
    if (avgHour >= 13 && avgHour <= 17) return 'afternoon';
    return 'evening';
  }

  determinePreferredContact(messages) {
    const fullText = messages.map(m => m.content).join(' ').toLowerCase();

    if (this.containsAny(fullText, ['call', 'phone', 'tawag'])) return 'phone';
    if (this.containsAny(fullText, ['email', 'message', 'text'])) return 'message';
    return 'messenger';
  }

  generateConversationSummary(messages) {
    if (messages.length <= 2) {
      return messages.map(m => m.content).join(' | ');
    }

    const firstMessage = messages[0].content;
    const lastMessage = messages[messages.length - 1].content;
    const interactionCount = messages.length;

    return `Started with: "${firstMessage}" | ${interactionCount} interactions | Latest: "${lastMessage}"`;
  }

  generateLeadId() {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Recommendation system
  getFollowUpRecommendation(leadData) {
    const recommendations = {
      timing: this.getTimingRecommendation(leadData),
      approach: this.getApproachRecommendation(leadData),
      script: this.getScriptRecommendation(leadData)
    };

    return recommendations;
  }

  getTimingRecommendation(leadData) {
    if (leadData.urgencyLevel === 'high') {
      return 'Contact immediately - within 5 minutes';
    }
    if (leadData.urgencyLevel === 'medium') {
      return 'Contact within 1 hour';
    }
    return 'Contact within 24 hours';
  }

  getApproachRecommendation(leadData) {
    if (leadData.objections.includes('price')) {
      return 'Focus on value proposition and payment options';
    }
    if (leadData.objections.includes('trust')) {
      return 'Provide testimonials and authenticity proof';
    }
    if (leadData.buyingStage === 'ready_to_buy') {
      return 'Guide directly to purchase process';
    }
    return 'Continue nurturing with helpful information';
  }

  getScriptRecommendation(leadData) {
    const name = leadData.name !== 'Unknown' ? leadData.name : '';
    const greeting = name ? `Hi ${name}!` : 'Hi there!';

    if (leadData.urgencyLevel === 'high') {
      return `${greeting} I saw you were interested in our products. I have a special offer that might interest you. When would be a good time to discuss this?`;
    }

    return `${greeting} Thanks for your interest in our products! I'd love to help you find exactly what you're looking for. Do you have any specific questions?`;
  }

  getNextSteps(userId, analysis) {
    if (analysis.score >= 20) {
      return 'Continue engagement - customer showing interest';
    }
    if (analysis.score >= 10) {
      return 'Provide helpful information to build trust';
    }
    return 'Monitor for increased engagement';
  }

  // Get all leads for dashboard
  getAllLeads(filter = {}) {
    const leads = Array.from(this.leads.values());

    if (filter.urgency) {
      return leads.filter(lead => lead.urgencyLevel === filter.urgency);
    }

    if (filter.status) {
      return leads.filter(lead => lead.status === filter.status);
    }

    return leads.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
  }

  // Get analytics
  getAnalytics() {
    const leads = Array.from(this.leads.values());

    return {
      totalLeads: leads.length,
      highUrgency: leads.filter(l => l.urgencyLevel === 'high').length,
      mediumUrgency: leads.filter(l => l.urgencyLevel === 'medium').length,
      lowUrgency: leads.filter(l => l.urgencyLevel === 'low').length,
      averageScore: leads.reduce((sum, l) => sum + l.score, 0) / leads.length || 0,
      conversionRate: this.calculateConversionRate(leads),
      topInterests: this.getTopInterests(leads)
    };
  }

  calculateConversionRate(leads) {
    const totalConversations = this.conversationHistory.size;
    return totalConversations > 0 ? (leads.length / totalConversations * 100).toFixed(1) : 0;
  }

  getTopInterests(leads) {
    const interests = {};
    leads.forEach(lead => {
      lead.interests.forEach(interest => {
        interests[interest] = (interests[interest] || 0) + 1;
      });
    });

    return Object.entries(interests)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([interest, count]) => ({ interest, count }));
  }
}

module.exports = LeadManager;