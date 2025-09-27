require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');
const ShopeeBot = require('./bot-logic');
const FacebookMessengerBot = require('./facebook-bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize bots
const bot = new ShopeeBot(process.env.SHOP_NAME || 'Your Shop');
let facebookBot = null;

// Initialize Facebook bot if credentials are available
if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_VERIFY_TOKEN) {
  facebookBot = new FacebookMessengerBot(
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    process.env.FACEBOOK_VERIFY_TOKEN,
    process.env.SHOP_NAME || 'Your Shop'
  );
  console.log('Facebook Messenger bot initialized');
}

// Store customer interactions for follow-up
const customerInteractions = [];

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Shopee Hello Bot is running!',
    timestamp: new Date().toISOString(),
    shopName: process.env.SHOP_NAME || 'Your Shop',
    version: '1.0.0'
  });
});

// Test page route
app.get('/test.html', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Webhook endpoint for Shopee chat messages
app.post('/webhook/shopee/chat', (req, res) => {
  try {
    console.log('Received webhook from Shopee:', req.body);

    // Verify webhook signature (implement based on Shopee's documentation)
    if (!verifyShopeeSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { message, user_name, conversation_id, shop_id } = req.body;

    if (message && user_name) {
      // Process message with bot
      const response = bot.processMessage(message, user_name);

      // Log interaction
      const interaction = bot.logCustomerInteraction(user_name, message, response);
      customerInteractions.push(interaction);

      // Send response back to Shopee (implement based on API)
      sendShopeeMessage(conversation_id, response, shop_id);

      res.json({
        success: true,
        message: 'Message processed successfully',
        response: response
      });
    } else {
      res.status(400).json({ error: 'Invalid message format' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual test endpoint for bot responses
app.post('/test/message', (req, res) => {
  const { message, userName = 'TestUser' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const response = bot.processMessage(message, userName);
  const interaction = bot.logCustomerInteraction(userName, message, response);

  res.json({
    input: message,
    response: response,
    interaction: interaction
  });
});

// Get customer interactions for sales follow-up
app.get('/interactions', (req, res) => {
  const potentialBuyers = customerInteractions.filter(
    interaction => interaction.potentialBuyer
  );

  res.json({
    totalInteractions: customerInteractions.length,
    potentialBuyers: potentialBuyers.length,
    interactions: customerInteractions,
    potentialBuyersData: potentialBuyers
  });
});

// Facebook Messenger webhook verification (GET)
app.get('/webhook/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (facebookBot) {
    const result = facebookBot.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Verification failed');
    }
  } else {
    res.status(500).send('Facebook bot not configured');
  }
});

// Facebook Messenger webhook for receiving messages (POST)
app.post('/webhook/facebook', async (req, res) => {
  try {
    if (!facebookBot) {
      return res.status(500).json({ error: 'Facebook bot not configured' });
    }

    const body = req.body;

    if (body.object === 'page') {
      // Process each messaging event
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          if (event.message) {
            // Regular message
            const interaction = await facebookBot.processEnhancedMessage(event);
            if (interaction) {
              customerInteractions.push(interaction);
            }
          } else if (event.postback) {
            // Button/quick reply postback
            await facebookBot.processPostback(event);
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Configure Facebook credentials
app.post('/config/facebook', (req, res) => {
  const { page_access_token, verify_token, shop_name } = req.body;

  if (!page_access_token || !verify_token) {
    return res.status(400).json({
      error: 'Both page_access_token and verify_token are required'
    });
  }

  // Store configuration (in production, use secure storage)
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN = page_access_token;
  process.env.FACEBOOK_VERIFY_TOKEN = verify_token;
  if (shop_name) process.env.SHOP_NAME = shop_name;

  // Reinitialize Facebook bot
  facebookBot = new FacebookMessengerBot(
    page_access_token,
    verify_token,
    shop_name || process.env.SHOP_NAME || 'Your Shop'
  );

  res.json({
    success: true,
    message: 'Facebook configuration updated',
    configured: {
      page_access_token: !!page_access_token,
      verify_token: !!verify_token,
      shop_name: shop_name || process.env.SHOP_NAME
    }
  });
});

// Configure Shopee API credentials
app.post('/config/shopee', (req, res) => {
  const { partner_id, partner_key, shop_id, access_token } = req.body;

  // Store configuration (in production, use secure storage)
  process.env.SHOPEE_PARTNER_ID = partner_id;
  process.env.SHOPEE_PARTNER_KEY = partner_key;
  process.env.SHOPEE_SHOP_ID = shop_id;
  process.env.SHOPEE_ACCESS_TOKEN = access_token;

  res.json({
    success: true,
    message: 'Shopee configuration updated',
    configured: {
      partner_id: !!partner_id,
      partner_key: !!partner_key,
      shop_id: !!shop_id,
      access_token: !!access_token
    }
  });
});

// Verify Shopee webhook signature
function verifyShopeeSignature(req) {
  // Implement Shopee signature verification
  // This is placeholder - implement based on Shopee's documentation
  const signature = req.headers['x-shopee-signature'];
  const timestamp = req.headers['x-shopee-timestamp'];

  if (!signature || !timestamp) {
    return false; // For testing, we'll allow requests without signature
  }

  // TODO: Implement actual signature verification
  return true;
}

// Send message to Shopee chat
async function sendShopeeMessage(conversationId, message, shopId) {
  try {
    // This is placeholder implementation
    // Implement based on Shopee Open Platform API documentation
    console.log(`Sending to Shopee Chat [${conversationId}]: ${message}`);

    // Example API call structure (implement with actual Shopee API)
    /*
    const response = await axios.post('https://partner.shopeemobile.com/api/v2/chat/send_message', {
      conversation_id: conversationId,
      message: message,
      shop_id: shopId
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SHOPEE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    */

    return { success: true };
  } catch (error) {
    console.error('Error sending Shopee message:', error);
    return { success: false, error: error.message };
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Shopee Hello Bot server is running on port ${PORT}`);
  console.log(`Shop Name: ${process.env.SHOP_NAME || 'Your Shop'}`);
  console.log(`Test the bot at: http://localhost:${PORT}/test/message`);
});