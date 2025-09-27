// Facebook Messenger Bot Integration
const axios = require('axios');
const ShopeeBot = require('./bot-logic');

class FacebookMessengerBot {
  constructor(pageAccessToken, verifyToken, shopName) {
    this.pageAccessToken = pageAccessToken;
    this.verifyToken = verifyToken;
    this.bot = new ShopeeBot(shopName);
    this.apiUrl = 'https://graph.facebook.com/v18.0/me/messages';
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

  // Enhanced response with quick replies for common actions
  async processEnhancedMessage(event) {
    try {
      const senderId = event.sender.id;
      const messageText = event.message?.text;

      if (!messageText) return;

      const senderInfo = await this.getSenderInfo(senderId);
      const userName = senderInfo.first_name || 'there';

      // Process with bot logic
      const response = this.bot.processMessage(messageText, userName);
      const category = this.bot.categorizeMessage(messageText);

      // Send response with quick replies based on category
      if (category === 'greeting') {
        await this.sendQuickReply(senderId, response, [
          { title: '💰 Check Prices', payload: 'PRICES' },
          { title: '📦 Check Stock', payload: 'STOCK' },
          { title: '🚚 Shipping Info', payload: 'SHIPPING' },
          { title: '🛒 Browse Products', payload: 'BROWSE' }
        ]);
      } else {
        await this.sendMessage(senderId, response);
      }

      // Log interaction
      return this.bot.logCustomerInteraction(userName, messageText, response);

    } catch (error) {
      console.error('Error in enhanced message processing:', error);
    }
  }

  // Handle postback events (when user clicks buttons)
  async processPostback(event) {
    try {
      const senderId = event.sender.id;
      const payload = event.postback.payload;

      let response = '';
      switch (payload) {
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

      await this.sendMessage(senderId, response);

    } catch (error) {
      console.error('Error processing postback:', error);
    }
  }
}

module.exports = FacebookMessengerBot;