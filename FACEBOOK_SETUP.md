# Facebook Messenger Bot Setup Guide

## 🎯 How to Activate Your Bot on Facebook Marketplace

Your bot is now ready for Facebook Messenger integration! Follow these steps to get it working with your Facebook Page and Marketplace listings.

## Step 1: Create a Facebook App

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. **Create a new app**:
   - Choose "Business" as app type
   - Enter your app name (e.g., "My Shop Bot")
   - Enter your contact email

## Step 2: Set Up Messenger Product

1. **Add Messenger to your app**:
   - In your app dashboard, click "Add Product"
   - Find "Messenger" and click "Set Up"

2. **Connect your Facebook Page**:
   - In Messenger settings, find "Access Tokens"
   - Click "Add or Remove Pages"
   - Select your business page
   - Copy the **Page Access Token** (save this!)

## Step 3: Configure Webhooks

1. **Deploy your bot first** (see deployment section below)

2. **Set up webhook in Facebook**:
   - In Messenger settings, find "Webhooks"
   - Click "Add Callback URL"
   - **Callback URL**: `https://your-domain.com/webhook/facebook`
   - **Verify Token**: Create a custom token (e.g., "MyShopBot2024")
   - Subscribe to: `messages`, `messaging_postbacks`

## Step 4: Configure Your Bot

1. **Add credentials to your `.env` file**:
   ```env
   FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
   FACEBOOK_VERIFY_TOKEN=MyShopBot2024
   SHOP_NAME=Your Shop Name
   ```

2. **Or configure via API**:
   ```bash
   curl -X POST http://your-domain.com/config/facebook \
     -H "Content-Type: application/json" \
     -d '{
       "page_access_token": "your_token_here",
       "verify_token": "MyShopBot2024",
       "shop_name": "Your Shop Name"
     }'
   ```

## Step 5: Deploy Your Bot

### Option A: Railway (Recommended - Free)
1. **Push to GitHub** (create a repository)
2. **Connect to Railway**: https://railway.app/
3. **Deploy from GitHub**
4. **Add environment variables** in Railway dashboard

### Option B: Heroku
1. **Install Heroku CLI**
2. **Create Heroku app**: `heroku create your-shop-bot`
3. **Set environment variables**: `heroku config:set FACEBOOK_PAGE_ACCESS_TOKEN=your_token`
4. **Deploy**: `git push heroku main`

### Option C: Vercel
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Deploy**: `vercel --prod`
3. **Add environment variables** in Vercel dashboard

## Step 6: Test Your Bot

1. **Test webhook verification**:
   ```bash
   curl "https://your-domain.com/webhook/facebook?hub.mode=subscribe&hub.verify_token=MyShopBot2024&hub.challenge=test123"
   ```
   Should return: `test123`

2. **Message your Facebook Page**:
   - Go to your Facebook Page
   - Send a message like "hello"
   - Bot should respond with greeting + quick reply buttons

## Step 7: Marketplace Integration

### For Marketplace Listings:
1. **Create Marketplace listings** on your Facebook Page
2. **Enable messaging** in Marketplace settings
3. **Customers can message you** directly through Marketplace
4. **Your bot will automatically respond** to their inquiries

### Enhanced Features:
- **Quick Reply Buttons**: "Check Prices", "Check Stock", "Shipping Info"
- **Automatic categorization**: Greetings, pricing, availability, shipping
- **Potential buyer tracking**: Logs customers likely to purchase
- **Multilingual support**: English and Filipino responses

## Bot Features for Marketplace

### Customer Messages → Bot Responses:
- **"Hello"** → Welcome message + quick reply options
- **"How much?"** → Asks for specific product
- **"Is this available?"** → Asks which item to check
- **"Shipping to Manila?"** → Asks for delivery details
- **"I want to buy this"** → Flags as potential buyer

### Data Collection:
- All interactions logged at: `GET /interactions`
- Potential buyers identified for follow-up
- Customer names from Facebook profiles
- Message categories and timestamps

## Troubleshooting

### Common Issues:
1. **Webhook verification fails**: Check verify token matches
2. **Messages not received**: Ensure page is connected and subscribed
3. **Bot not responding**: Check logs and access token validity
4. **HTTPS required**: Facebook requires HTTPS URLs for webhooks

### Testing Locally:
1. **Use ngrok for local testing**:
   ```bash
   npm install -g ngrok
   ngrok http 3000
   ```
2. **Use the ngrok URL** as your webhook URL temporarily

## Next Steps

1. **Customize responses** in `bot-logic.js`
2. **Add product catalog integration**
3. **Set up payment processing**
4. **Create automated follow-up sequences**
5. **Add analytics and reporting**

## Support

- **Facebook Messenger API Docs**: https://developers.facebook.com/docs/messenger-platform/
- **Test webhook**: `POST /test/message` endpoint
- **View interactions**: `GET /interactions` endpoint

Your Facebook Messenger bot is ready to handle customer inquiries 24/7 and help convert Marketplace browsers into buyers! 🚀