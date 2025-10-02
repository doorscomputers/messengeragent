# 🚀 Deployment Guide - FB Messenger Agent

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Node.js installed (v14 or higher)
- [ ] Facebook App created (App ID: 671005738903644)
- [ ] Facebook Page created (for testing)
- [ ] Facebook Test User created
- [ ] A public URL for webhooks (Heroku, Render, Railway, ngrok, etc.)

---

## 🔧 Step 1: Environment Configuration

### Create `.env` file:

```bash
# Facebook Configuration
FACEBOOK_APP_ID=671005738903644
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
FACEBOOK_VERIFY_TOKEN=your_custom_verify_token

# App Configuration
PORT=3001
SHOP_NAME=Your Business Name
NODE_ENV=production

# Optional: Business Information
BUSINESS_TYPE=E-commerce
LOCATION=Your Location
```

### Where to Find These Values:

**FACEBOOK_APP_SECRET:**
1. Go to https://developers.facebook.com/apps/671005738903644
2. Settings → Basic → App Secret (click "Show")

**FACEBOOK_PAGE_ACCESS_TOKEN:**
- Will be obtained automatically via OAuth flow
- Or get manually: Tools → Graph API Explorer → Get Page Access Token

**FACEBOOK_VERIFY_TOKEN:**
- Choose any random string (e.g., "messenger_verify_token_2024")
- Must match webhook configuration in Facebook App

---

## 📦 Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list
```

**Required packages:**
- express (5.1.0)
- axios (1.12.2)
- cors (2.8.5)
- body-parser (2.2.0)
- dotenv (17.2.2)
- crypto (1.0.1)
- sqlite3 (latest)
- nodemon (3.1.10) - for development

---

## 🌐 Step 3: Deploy to Hosting Platform

### Option A: Heroku (Recommended)

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Set environment variables
heroku config:set FACEBOOK_APP_ID=671005738903644
heroku config:set FACEBOOK_APP_SECRET=your_secret
heroku config:set FACEBOOK_VERIFY_TOKEN=your_verify_token
heroku config:set NODE_ENV=production

# Deploy
git add .
git commit -m "Initial deployment"
git push heroku master

# View logs
heroku logs --tail
```

**Your webhook URL will be:** `https://your-app-name.herokuapp.com/webhook/facebook`

### Option B: Render.com

1. Connect your GitHub repository
2. Create new Web Service
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables in dashboard
6. Deploy

**Your webhook URL will be:** `https://your-app-name.onrender.com/webhook/facebook`

### Option C: Railway.app

1. Connect GitHub repository
2. Create new project
3. Add environment variables
4. Deploy automatically

**Your webhook URL will be:** `https://your-app-name.up.railway.app/webhook/facebook`

### Option D: ngrok (For Local Testing)

```bash
# Start your local server
npm start

# In another terminal, start ngrok
ngrok http 3001

# Use the HTTPS URL provided (e.g., https://abc123.ngrok.io)
```

**Your webhook URL will be:** `https://abc123.ngrok.io/webhook/facebook`

⚠️ **Note:** ngrok URLs change on restart unless you have a paid plan

---

## 🔗 Step 4: Configure Facebook App

### A. Set Webhook URL

1. Go to https://developers.facebook.com/apps/671005738903644
2. Navigate to **Messenger → Settings**
3. In "Webhooks" section, click **"Add Callback URL"**
4. Enter:
   - **Callback URL:** `https://your-domain.com/webhook/facebook`
   - **Verify Token:** (same as FACEBOOK_VERIFY_TOKEN in .env)
5. Click **"Verify and Save"**

### B. Subscribe to Webhook Fields

After webhook is verified, subscribe to these fields:
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `messaging_optins`
- ✅ `message_deliveries`
- ✅ `message_reads`

### C. Add Test Users

1. Go to **Roles → Test Users**
2. Click **"Add Test User"**
3. Create test user
4. Copy credentials (email/password)
5. Login as test user and send a message to your Page

---

## 🧪 Step 5: Test the Application

### A. Test Webhook Verification

```bash
# Manual test
curl "https://your-domain.com/webhook/facebook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test123"

# Expected response: test123
```

### B. Test OAuth Login

1. Open `https://your-domain.com/facebook-login`
2. Click "Continue with Facebook"
3. Approve all permissions
4. Verify pages appear in the list

### C. Test Messaging

1. Open `https://your-domain.com/messaging-demo`
2. Select connected page
3. Enter test user PSID
4. Send a test message
5. Verify message appears in Messenger

### D. Test Webhook Reception

1. As test user, send a message to your Page
2. Check server logs:
   ```bash
   # Heroku
   heroku logs --tail

   # Local
   Check console output
   ```
3. Verify bot responds automatically

---

## 📊 Step 6: Database Setup

The app uses SQLite by default. Database will be created automatically at:
`./messenger_agent.db`

### Verify Database Tables:

```bash
# Install sqlite3 CLI
npm install -g sqlite3

# Open database
sqlite3 messenger_agent.db

# Check tables
.tables

# Should show:
# - business_configs
# - products
# - faqs
# - customer_interactions
# - leads
# - facebook_pages
# - analytics_data
# - conversion_events
```

---

## 🔒 Step 7: Security Checklist

Before going live:

- [ ] Never commit `.env` file to Git (add to `.gitignore`)
- [ ] Use strong FACEBOOK_VERIFY_TOKEN (random, 32+ characters)
- [ ] Keep FACEBOOK_APP_SECRET secure
- [ ] Enable HTTPS only (no HTTP)
- [ ] Validate webhook signatures (already implemented)
- [ ] Rate limit API endpoints (optional but recommended)
- [ ] Enable CORS only for trusted domains
- [ ] Regularly rotate access tokens

### Add to `.gitignore`:

```
.env
*.db
node_modules/
*.log
```

---

## 📱 Step 8: Facebook App Review Preparation

### A. Privacy Policy URL

Set in Facebook App Settings → Basic:
```
https://your-domain.com/privacy-policy
```

### B. Data Deletion Callback URL

Set in Facebook App Settings → Basic:
```
https://your-domain.com/data-deletion
```

### C. App Domains

Add in Facebook App Settings → Basic:
```
your-domain.com
```

### D. Valid OAuth Redirect URIs

Messenger → Settings → Add OAuth Redirect URIs:
```
https://your-domain.com/facebook-login
https://your-domain.com/
```

---

## 🎥 Step 9: Record Demonstration Video

Follow the detailed guide in `VIDEO_RECORDING_SCRIPT.md`

### Quick Checklist:
1. Start at `/facebook-login`
2. Show OAuth permission dialog
3. Show page selection
4. Subscribe webhooks
5. Send message from `/messaging-demo`
6. **Show message in actual Messenger inbox**
7. Show business account connection

---

## 🚀 Step 10: Submit for Review

1. Go to App Dashboard → App Review → Permissions and Features
2. Request these permissions:
   - `pages_show_list`
   - `pages_manage_metadata`
   - `pages_messaging`
   - `business_management`

3. For each permission, provide:
   - **Use case description** (see `FACEBOOK_REVIEW_GUIDE.md`)
   - **Screencast video**
   - **Testing instructions**

4. Use the test user credentials from Step 4C

5. Submit and wait for review (typically 1-3 business days)

---

## 🐛 Troubleshooting

### Issue: Webhook verification fails

**Solution:**
- Check FACEBOOK_VERIFY_TOKEN matches in both .env and Facebook App
- Ensure webhook URL is publicly accessible (test with curl)
- Check server logs for errors

### Issue: Messages not sending

**Solution:**
- Verify FACEBOOK_PAGE_ACCESS_TOKEN is valid
- Check Page is connected to the app
- Ensure recipient PSID is correct
- Check Facebook API error logs

### Issue: OAuth login not working

**Solution:**
- Verify FACEBOOK_APP_ID is correct in `facebook-login.html`
- Check OAuth Redirect URIs in Facebook App settings
- Ensure domain is added to App Domains

### Issue: Database errors

**Solution:**
```bash
# Delete old database
rm messenger_agent.db

# Restart server (database will be recreated)
npm start
```

---

## 📝 Monitoring & Logs

### View Server Logs:

**Heroku:**
```bash
heroku logs --tail --app your-app-name
```

**Render:**
- Dashboard → Logs tab

**Local:**
- Console output

### Important Log Messages:

```
✅ Connected to SQLite database
🤖 AI-powered Facebook Messenger bot initialized
📥 Received Facebook webhook
✅ AI-powered interaction processed
```

---

## 🔄 Updating the App

```bash
# Make changes to code

# Test locally
npm run dev

# Commit changes
git add .
git commit -m "Your changes"

# Deploy
git push heroku master  # or your hosting platform
```

---

## 📊 Post-Deployment Checklist

After deployment, verify:

- [ ] Home page loads at `https://your-domain.com`
- [ ] Facebook login works at `/facebook-login`
- [ ] Messaging demo works at `/messaging-demo`
- [ ] Dashboard accessible at `/dashboard`
- [ ] Privacy policy loads at `/privacy-policy`
- [ ] Webhook endpoint responds at `/webhook/facebook`
- [ ] Database tables created successfully
- [ ] Environment variables set correctly
- [ ] HTTPS enabled (not HTTP)
- [ ] No console errors in browser
- [ ] Test message successfully sent and received

---

## 🎯 Quick Start Commands

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start

# Test the server
curl https://your-domain.com/health

# Check database
sqlite3 messenger_agent.db "SELECT * FROM facebook_pages;"
```

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs first:** `heroku logs --tail`
2. **Review error messages:** Console and browser console
3. **Test endpoints:** Use curl or Postman
4. **Verify environment variables:** `heroku config`
5. **Check Facebook App settings:** Webhooks, permissions, domains

---

## ✅ Final Verification

Before submitting to Facebook:

```bash
# Test checklist
curl https://your-domain.com/health
# Expected: {"status":"OK"}

curl https://your-domain.com/privacy-policy
# Expected: HTML page loads

curl "https://your-domain.com/webhook/facebook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
# Expected: test

# Open in browser
open https://your-domain.com/facebook-login
# Expected: Facebook Login page with permissions

open https://your-domain.com/messaging-demo
# Expected: Messaging demo interface
```

---

## 🎉 You're Ready!

Once all checks pass:
1. ✅ App deployed and accessible
2. ✅ Webhook configured and verified
3. ✅ OAuth login working
4. ✅ Messaging functionality tested
5. ✅ Video recorded following the script
6. ✅ All documentation prepared

**Submit your app for Facebook review!**

Good luck! 🚀
