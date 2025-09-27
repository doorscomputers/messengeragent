# Facebook Messenger Bot Setup - Visual Guide

## Step-by-Step Visual Instructions

### Step 1: Create Facebook App

**Current Page**: You're on the Messenger Platform overview page

**What to do next:**

1. **Click "Get Started"** button (usually top-right corner)
   - OR go directly to: https://developers.facebook.com/apps/
   - OR look for "Create App" button

2. **App Creation Form:**
   ```
   ┌─────────────────────────────────┐
   │  What do you want your app to do? │
   │                                 │
   │  ○ Allow people to log in       │
   │  ● Connect to APIs for business │  ← Select this
   │  ○ None or I'm not sure         │
   │                                 │
   │         [Continue]              │
   └─────────────────────────────────┘
   ```

3. **App Details Form:**
   ```
   ┌─────────────────────────────────┐
   │  App name: [My Shop Bot      ]  │
   │  App contact email:             │
   │  [your-email@domain.com     ]   │
   │                                 │
   │  Business Manager Account:      │
   │  [None - Skip this          ]   │
   │                                 │
   │         [Create App]            │
   └─────────────────────────────────┘
   ```

### Step 2: Add Messenger Product

**After app creation, you'll see the App Dashboard:**

```
┌─────────────────────────────────────────────────────┐
│  My Shop Bot - App Dashboard                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Add products to your app                           │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │Facebook │  │Instagram│  │Messenger│ ← Click this│
│  │ Login   │  │ Basic   │  │         │             │
│  │[Set Up] │  │[Set Up] │  │[Set Up] │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step 3: Configure Messenger

**After clicking "Set Up" on Messenger:**

```
┌─────────────────────────────────────────────────────┐
│  Messenger Settings                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Access Tokens                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Add or Remove Pages                        │   │
│  │  [+ Add or Remove Pages]  ← Click this      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  2. Webhooks                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │  Callback URL: [________________]           │   │
│  │  Verify Token: [________________]           │   │
│  │  [ ] messages                               │   │
│  │  [ ] messaging_postbacks                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step 4: Connect Your Facebook Page

**When you click "Add or Remove Pages":**

```
┌─────────────────────────────────────────────────────┐
│  Select Pages                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ☐ Your Business Page Name                          │
│  ☐ Another Page                                     │
│  ☐ Create New Page                                  │
│                                                     │
│                    [Continue]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**After selecting your page:**

```
┌─────────────────────────────────────────────────────┐
│  Page Access Tokens                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your Business Page                                 │
│  Token: EAABw...very-long-token...xyz               │
│  [Copy Token] ← Copy this for your .env file        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Before Webhook Setup - Deploy Your Bot!

**⚠️ IMPORTANT**: You need to deploy your bot first to get a public HTTPS URL.

### Quick Deploy Options:

#### Option A: Railway (Recommended)
1. **Go to**: https://railway.app/
2. **Sign up with GitHub**
3. **New Project → Deploy from GitHub**
4. **Select your repository**
5. **Add environment variables**:
   ```
   FACEBOOK_PAGE_ACCESS_TOKEN=your_copied_token
   FACEBOOK_VERIFY_TOKEN=MyBot2024
   SHOP_NAME=Your Shop Name
   ```
6. **Your URL will be**: `https://your-app-name.railway.app`

#### Option B: Heroku
1. **Install Heroku CLI**
2. **Commands**:
   ```bash
   heroku create your-bot-name
   heroku config:set FACEBOOK_PAGE_ACCESS_TOKEN=your_token
   heroku config:set FACEBOOK_VERIFY_TOKEN=MyBot2024
   git push heroku main
   ```

### Step 5: Configure Webhook (After Deployment)

**Back in Facebook Messenger Settings:**

```
┌─────────────────────────────────────────────────────┐
│  Webhooks                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Callback URL:                                      │
│  [https://your-app.railway.app/webhook/facebook]    │
│                                                     │
│  Verify Token:                                      │
│  [MyBot2024]  ← Must match your .env file          │
│                                                     │
│  Subscription Fields:                               │
│  ☑ messages                                        │
│  ☑ messaging_postbacks                             │
│                                                     │
│            [Verify and Save]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Testing Your Bot

**After successful webhook verification:**

1. **Go to your Facebook Page**
2. **Click "Send Message"**
3. **Type**: "hello"
4. **You should see**:
   ```
   Bot: Hello [Your Name]! Welcome to Your Shop Name! 👋

   [💰 Check Prices] [📦 Check Stock] [🚚 Shipping Info]
   ```

## Troubleshooting Visual Indicators

### ✅ Success Indicators:
- Green checkmark next to webhook verification
- "Webhook verified" message
- Bot responds to test messages

### ❌ Common Issues:
- Red X next to webhook = URL or token mismatch
- "Failed to verify" = Check your deployed bot logs
- No response = Check Facebook page connection

## Next: Marketplace Integration

**Once your bot is working:**

1. **Create Marketplace listings** on your Facebook Page
2. **Enable messaging** in Marketplace settings
3. **Customers can message you** through listings
4. **Bot automatically responds** 24/7

Your bot is now ready for Facebook Marketplace! 🚀