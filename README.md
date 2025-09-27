# Facebook Messenger Bot for Marketplace

A chatbot that automatically responds to customer inquiries on Facebook Marketplace through Messenger.

## Features

- **24/7 Automated Responses**: Responds to greetings, pricing, availability, and shipping inquiries
- **Customer Tracking**: Logs interactions and identifies potential buyers
- **Multilingual Support**: Handles English and Filipino messages
- **Quick Reply Buttons**: Interactive responses for better customer experience

## Setup

### Environment Variables

Set these in your deployment platform:

```env
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
FACEBOOK_VERIFY_TOKEN=MessengerBot2024
SHOP_NAME=AIO Business
PORT=3000
```

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Test the bot:
```bash
curl -X POST http://localhost:3000/test/message \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "userName": "TestCustomer"}'
```

## Webhook Configuration

- **Webhook URL**: `https://your-deployed-app.railway.app/webhook/facebook`
- **Verify Token**: `MessengerBot2024`
- **Subscription Fields**: `messages`, `messaging_postbacks`

## Bot Responses

| Customer Message | Bot Response |
|------------------|--------------|
| "hello", "hi", "kumusta" | Welcome message with quick reply buttons |
| "price", "magkano" | Asks for specific product |
| "available", "stock", "meron" | Asks which item to check |
| "shipping", "delivery" | Asks for delivery location |

## API Endpoints

- `GET /` - Bot status
- `GET /health` - Health check
- `POST /webhook/facebook` - Facebook webhook (for messages)
- `GET /webhook/facebook` - Facebook webhook verification
- `POST /test/message` - Test bot responses
- `GET /interactions` - View customer interactions

## Deployment

This bot is ready for deployment on platforms like Railway, Heroku, or Vercel.

## Facebook App Configuration

1. Create Facebook App at developers.facebook.com
2. Add Messenger product
3. Connect your Facebook Page
4. Set webhook URL and verify token
5. Subscribe to messages and messaging_postbacks

Your bot will now automatically respond to customers messaging your Facebook Page through Marketplace!