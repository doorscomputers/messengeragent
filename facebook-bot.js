// Facebook Messenger Bot Integration
const axios = require('axios');
const ShopeeBot = require('./bot-logic');
const AIEngine = require('./ai-engine');
const BusinessConfig = require('./business-config');
const LeadManager = require('./lead-manager');

class FacebookMessengerBot {
  constructor(pageAccessToken, verifyToken, shopName, businessConfig = null) {
    this.pageAccessToken = pageAccessToken;
    this.verifyToken = verifyToken;
    this.bot = new ShopeeBot(shopName);
    this.apiUrl = 'https://graph.facebook.com/v18.0/me/messages';

    // Initialize AI Engine with business configuration
    this.businessConfig = businessConfig || BusinessConfig.getDemoConfig();
    this.aiEngine = new AIEngine(this.businessConfig);
    this.leadManager = new LeadManager({
      autoCapture: true,
      scoreThreshold: 25
    });

    console.log('🤖 AI-powered Facebook Messenger Bot initialized');
    console.log(`📊 Loaded ${this.businessConfig.products.length} products and ${this.businessConfig.faqs.length} FAQs`);
  }

  // Verify webhook (required by Facebook)
  verifyWebhook(mode, token, challenge) {
    console.log('verifyWebhook called with:');
    console.log('  mode:', mode);
    console.log('  token:', token);
    console.log('  this.verifyToken:', this.verifyToken);
    console.log('  challenge:', challenge);
    console.log('  mode check:', mode === 'subscribe');
    console.log('  token check:', token === this.verifyToken);

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('Facebook webhook verified successfully');
      return challenge;
    }
    console.log('Facebook webhook verification failed');
    return null;
  }

  // Process incoming Facebook messages
  async processMessage(event) {
    try {
      const senderId = event.sender.id;
      const messageText = event.message?.text;

      if (!messageText) {
        console.log('Received non-text message');
        return;
      }

      console.log(`Received message from ${senderId}: ${messageText}`);

      // Get sender info from Facebook
      const senderInfo = await this.getSenderInfo(senderId);
      const userName = senderInfo.first_name || 'there';

      // Process with bot logic
      const response = this.bot.processMessage(messageText, userName);

      // Log interaction
      const interaction = this.bot.logCustomerInteraction(userName, messageText, response);

      // Send response back to Facebook
      await this.sendMessage(senderId, response);

      return interaction;

    } catch (error) {
      console.error('Error processing Facebook message:', error);
      await this.sendMessage(event.sender.id, 'Sorry, I encountered an error. Please try again.');
    }
  }

  // Get sender information from Facebook
  async getSenderInfo(senderId) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${senderId}`, {
        params: {
          fields: 'first_name,last_name',
          access_token: this.pageAccessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting sender info:', error);
      return { first_name: 'Customer' };
    }
  }

  // Send message to Facebook user
  async sendMessage(recipientId, messageText) {
    try {
      const messageData = {
        recipient: { id: recipientId },
        message: { text: messageText },
        messaging_type: 'RESPONSE'
      };

      const response = await axios.post(this.apiUrl, messageData, {
        params: { access_token: this.pageAccessToken },
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`Message sent to ${recipientId}: ${messageText}`);
      return response.data;

    } catch (error) {
      console.error('Error sending Facebook message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send rich message with quick replies
  async sendQuickReply(recipientId, text, quickReplies) {
    try {
      const messageData = {
        recipient: { id: recipientId },
        message: {
          text: text,
          quick_replies: quickReplies.map(reply => ({
            content_type: 'text',
            title: reply.title,
            payload: reply.payload
          }))
        },
        messaging_type: 'RESPONSE'
      };

      const response = await axios.post(this.apiUrl, messageData, {
        params: { access_token: this.pageAccessToken },
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending quick reply:', error);
      throw error;
    }
  }

  // Enhanced AI-powered message processing
  async processEnhancedMessage(event) {
    try {
      const senderId = event.sender.id;
      const messageText = event.message?.text;

      if (!messageText) return;

      console.log(`🔍 Processing message from ${senderId}: "${messageText}"`);

      const senderInfo = await this.getSenderInfo(senderId);
      const userName = senderInfo.first_name || 'there';

      // Process with AI Engine for intelligent responses
      const aiResponse = await this.aiEngine.processIntelligentMessage(
        messageText,
        senderId,
        userName
      );

      console.log(`🤖 AI Response: ${aiResponse.response}`);
      console.log(`📊 Lead Score: ${aiResponse.leadData?.score || 0}`);

      // Send AI-generated response
      if (aiResponse.quickReplies && aiResponse.quickReplies.length > 0) {
        await this.sendQuickReply(senderId, aiResponse.response, aiResponse.quickReplies);
      } else {
        await this.sendMessage(senderId, aiResponse.response);
      }

      // Process lead information
      const leadResult = await this.leadManager.processLead(senderId, {
        message: messageText,
        userName: userName,
        senderInfo: senderInfo
      }, aiResponse);

      // Handle lead capture
      if (leadResult.leadCaptured) {
        console.log(`🎯 Lead captured! Score: ${leadResult.leadData.score}, Urgency: ${leadResult.leadData.urgencyLevel}`);

        // Send lead notification to business owner (optional)
        if (leadResult.leadData.urgencyLevel === 'high') {
          console.log(`🚨 HIGH PRIORITY LEAD: ${leadResult.leadData.name} - ${leadResult.recommendation.timing}`);
        }
      }

      // Return enhanced interaction data
      return {
        ...this.bot.logCustomerInteraction(userName, messageText, aiResponse.response),
        aiAnalysis: {
          score: aiResponse.leadData?.score || 0,
          urgency: aiResponse.leadData?.urgencyLevel || 'low',
          shouldCapture: aiResponse.shouldCaptureLead || false
        },
        leadResult: leadResult
      };

    } catch (error) {
      console.error('Error in AI message processing:', error);

      // Fallback to simple bot
      const senderInfo = await this.getSenderInfo(event.sender.id);
      const userName = senderInfo.first_name || 'there';
      const fallbackResponse = this.bot.processMessage(event.message?.text, userName);

      await this.sendMessage(event.sender.id, fallbackResponse);
      return this.bot.logCustomerInteraction(userName, event.message?.text, fallbackResponse);
    }
  }

  // Handle postback events (when user clicks buttons)
  async processPostback(event) {
    try {
      const senderId = event.sender.id;
      const payload = event.postback.payload;
      const senderInfo = await this.getSenderInfo(senderId);
      const userName = senderInfo.first_name || 'there';

      let response = '';
      let quickReplies = [];

      switch (payload) {
        case 'COMPLETE_ORDER':
          response = `Perfect, ${userName}! To complete your order, please:

🔗 **Visit our main page**: AIO Business
📞 **Call us**: Mon-Sat 9AM-6PM
💬 **Continue messaging**: I'll connect you with our sales team

**We'll process your order immediately!**`;
          quickReplies = [
            { title: '📱 Visit Page', payload: 'VIEW_PAGE' },
            { title: '📞 Get Phone', payload: 'GET_PHONE' },
            { title: '💬 Talk to Agent', payload: 'HUMAN_AGENT' }
          ];
          break;

        case 'HUMAN_AGENT':
          response = `I'm connecting you with our sales team now, ${userName}! 👨‍💼

**A live agent will assist you with:**
• Order processing
• Payment options
• Delivery arrangements
• Any special requests

Please wait a moment while I transfer you...`;
          break;

        case 'GET_PHONE':
          response = `📞 **Contact Information**

**Phone**: +63 917 123 4567
**Business Hours**: Mon-Sat 9AM-6PM
**Location**: Metro Manila

Feel free to call us directly for immediate assistance!`;
          quickReplies = [
            { title: '💬 Continue Chat', payload: 'CONTINUE_CHAT' },
            { title: '🛒 Order Now', payload: 'COMPLETE_ORDER' }
          ];
          break;

        case 'VIEW_PAGE':
          response = `📱 **Visit Our Main Page**

Search for "AIO Business" on Facebook to see our complete catalog and place orders directly.

You can also continue chatting here for any questions!`;
          quickReplies = [
            { title: '💬 Continue Chat', payload: 'CONTINUE_CHAT' },
            { title: '📞 Call Us', payload: 'GET_PHONE' }
          ];
          break;

        case 'PRICES':
          response = 'What product would you like to know the price for? 💰';
          break;
        case 'STOCK':
          response = 'Which item would you like me to check availability for? 📦';
          break;
        case 'SHIPPING':
          response = 'Where would you like your order delivered? 🚚';
          break;
        case 'BROWSE':
          response = 'Here are our popular items! What category interests you? 🛒';
          break;
        default:
          response = 'How can I help you today?';
      }

      if (quickReplies.length > 0) {
        await this.sendQuickReply(senderId, response, quickReplies);
      } else {
        await this.sendMessage(senderId, response);
      }

    } catch (error) {
      console.error('Error processing postback:', error);
    }
  }
}

module.exports = FacebookMessengerBot;