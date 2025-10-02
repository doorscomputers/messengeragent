# Video Recording Script for Facebook App Review

## 🎥 Screencast Requirements

**Total Duration:** 2-3 minutes
**Format:** MP4, MOV, or WebM
**Resolution:** 1280x720 minimum (1920x1080 recommended)
**Audio:** Optional but recommended for clarity

---

## 🎬 Recording Setup

### Tools You Can Use:
- **Windows:** OBS Studio, ShareX, Windows Game Bar (Win+G)
- **Mac:** QuickTime Screen Recording, OBS Studio
- **Online:** Loom, Screencastify

### Before Recording:
1. ✅ Close unnecessary browser tabs
2. ✅ Clear browser console
3. ✅ Test all functionality beforehand
4. ✅ Have test user credentials ready
5. ✅ Ensure webhook is working
6. ✅ Prepare Messenger app/web (login as test user)
7. ✅ Clear previous test messages

---

## 📝 Recording Script (Follow This Exactly)

### SCENE 1: Introduction (0:00 - 0:15)
**What to Show:**
- Open your app's home page

**What to Say (optional):**
> "Hello Facebook reviewers. This is FB Messenger Agent, a SaaS platform that helps e-commerce businesses automate customer conversations through Facebook Messenger. Let me demonstrate all the requested permissions."

**Actions:**
1. Show home page for 3 seconds
2. Highlight the "Facebook Login" button
3. Move cursor to button (don't click yet)

---

### SCENE 2: Facebook Authentication (0:15 - 0:45)
**What to Show:**
- Facebook OAuth login flow
- Permission dialog with ALL 4 permissions

**Critical Steps:**
1. **Click "🔐 Facebook Login" button**
2. **Wait for Facebook OAuth dialog to appear**
3. **IMPORTANT:** Make sure the dialog is FULLY VISIBLE
4. **Hover over or highlight the permissions list:**
   - pages_show_list
   - pages_manage_metadata
   - pages_messaging
   - business_management
5. **Click "Continue as [Your Name]"**
6. **Wait for redirect back to app**
7. **Show success message**

**What to Say:**
> "First, I'll connect with Facebook. As you can see, the app requests four permissions: pages_show_list to view my Pages, pages_manage_metadata to configure webhooks, pages_messaging to send and receive messages, and business_management to connect my business account. I'll approve these now."

**⚠️ CRITICAL:** The permission dialog MUST be visible and clear in the video. Pause for 2-3 seconds on this screen.

---

### SCENE 3: Page Selection - pages_show_list (0:45 - 1:00)
**What to Show:**
- List of Facebook Pages
- Page selection and connection

**Actions:**
1. **Show the "Connected Pages" section**
2. **Highlight the page names and categories**
3. **Point to or hover over:**
   - Page name
   - Category
   - Page ID
4. **Show that multiple pages are listed**

**What to Say:**
> "Now the app displays all my Facebook Pages. Here you can see the pages_show_list permission in action - it retrieves the list of Pages I manage, showing their names, categories, and IDs."

---

### SCENE 4: Webhook Subscription - pages_manage_metadata (1:00 - 1:15)
**What to Show:**
- Webhook subscription process

**Actions:**
1. **Click "Subscribe Webhooks" button**
2. **Wait for success message**
3. **Show confirmation:** "Webhooks subscribed successfully"
4. **Optional:** Show browser console with API response

**What to Say:**
> "Next, I'll subscribe to webhooks using the pages_manage_metadata permission. This configures the Page to send message events to our app."

**What This Proves:**
- ✅ App can modify page settings
- ✅ Webhook subscription successful
- ✅ Permission working as intended

---

### SCENE 5: Send Message - pages_messaging (1:15 - 2:00)
**⭐ MOST IMPORTANT SCENE - DO NOT SKIP ⭐**

**What to Show:**
- Messaging demo interface
- Sending a message from app
- **Message appearing in REAL Messenger inbox**

**Actions:**
1. **Navigate to "💬 Messaging Demo" page**
2. **Show the two-panel interface:**
   - Left: App interface
   - Right: Messenger inbox simulation
3. **Select the connected page from dropdown**
4. **Enter test user PSID**
5. **Click "Initialize Demo"**
6. **Type a test message:**
   - Example: "Hello! Testing the messaging integration. This message is sent from the app!"
7. **Click "Send" button**
8. **Show the message in the left panel (app sent)**
9. **Show activity logs (API call visible)**

**THEN - CRITICAL PART:**

10. **Switch to actual Facebook Messenger:**
    - Option A: Open Messenger.com in new tab
    - Option B: Show mobile Messenger app via phone screen
11. **Show the conversation with your Page**
12. **DEMONSTRATE that the message appears in the inbox**
13. **Show timestamp and "Delivered" status**
14. **Optional:** Hover over message to show it came from the Page

**What to Say:**
> "Now I'll demonstrate the pages_messaging permission. I'll type a message in our app interface and send it to a Messenger user. Watch as I click Send... and now, let me switch to the actual Messenger inbox... As you can see, the message has been successfully delivered and appears in the user's Messenger inbox with a timestamp. This proves the end-to-end messaging flow."

**⚠️ CRITICAL REQUIREMENTS:**
- Message MUST appear in REAL Messenger inbox
- Both screens (app + Messenger) should be visible
- Message delivery must be clear and obvious
- Timestamp must be visible

**Common Mistakes to Avoid:**
- ❌ Only showing the app interface
- ❌ Not showing actual Messenger inbox
- ❌ Using screenshots instead of live recording
- ❌ Skipping the "switch to Messenger" step

---

### SCENE 6: Business Management (2:00 - 2:15)
**What to Show:**
- Business account connection

**Actions:**
1. **Go back to the Facebook Login page or home**
2. **Open browser developer console (F12)**
3. **Show console logs with business account info:**
   ```
   Business accounts: [{id: "123...", name: "My Business"}]
   ✓ Connected to 1 business account(s)
   ```
4. **Alternatively:** If you built a UI for this, show the business account name and ID

**What to Say:**
> "The business_management permission allows us to access the user's business accounts. You can see in the console that we successfully retrieved the business information, including the business name and ID."

**Note:** This can be brief since the main functionality is shown during login.

---

### SCENE 7: Conclusion (2:15 - 2:30)
**What to Show:**
- Quick overview/summary

**Actions:**
1. **Navigate back to home page or dashboard**
2. **Show the complete, working application**

**What to Say:**
> "To summarize: We've successfully demonstrated all four requested permissions - pages_show_list for viewing Pages, pages_manage_metadata for webhook configuration, pages_messaging for sending messages to Messenger, and business_management for accessing business accounts. The app is fully functional and ready for production use. Thank you for reviewing our application."

---

## ✅ Post-Recording Checklist

Before uploading, verify your video shows:

- [ ] **Facebook OAuth dialog clearly visible**
- [ ] **All 4 permissions listed in the dialog**
- [ ] **User clicking "Continue" to approve**
- [ ] **List of Facebook Pages displayed**
- [ ] **Webhook subscription successful**
- [ ] **Message typed in app interface**
- [ ] **Message sent via API**
- [ ] **CRITICAL: Message appearing in Messenger inbox**
- [ ] **Business account information visible**
- [ ] **No errors or glitches**
- [ ] **Clear screen resolution (readable text)**
- [ ] **Video duration: 2-3 minutes**

---

## 🎯 Key Points to Remember

### DO:
✅ Show the ENTIRE permission dialog
✅ Clearly demonstrate each permission
✅ Show actual Messenger inbox receiving message
✅ Keep video under 3 minutes
✅ Use clear, readable screen resolution
✅ Test everything before recording
✅ Show smooth, error-free flow

### DON'T:
❌ Rush through the permission dialog
❌ Skip showing the Messenger inbox
❌ Use only screenshots
❌ Have errors or broken features
❌ Make video too long (>5 minutes)
❌ Show unrelated functionality
❌ Forget to show Facebook authentication

---

## 📸 Alternative: Multiple Short Videos

If one continuous video is difficult, you can submit multiple short videos:

1. **Video 1:** Facebook Login + Permission Dialog (30 seconds)
2. **Video 2:** Page Selection + Webhook Subscription (45 seconds)
3. **Video 3:** Message Sending + Messenger Inbox (60 seconds)
4. **Video 4:** Business Management (15 seconds)

**Total:** ~2.5 minutes across 4 videos

---

## 🔧 Technical Recording Tips

### Browser Setup:
```
1. Zoom to 100% (Ctrl+0 / Cmd+0)
2. Full screen or maximize browser window
3. Close bookmarks bar for cleaner look
4. Use Incognito/Private mode for clean session
```

### What to Have Open:
- Tab 1: Your app
- Tab 2: Facebook Messenger (messenger.com)
- Optional Tab 3: Facebook Business Manager (if showing business_management)

### Screen Layout Options:

**Option A: Single Screen**
- Record full screen
- Switch between tabs
- Use picture-in-picture for Messenger mobile

**Option B: Split Screen**
- Left: Your app
- Right: Messenger.com
- Shows both simultaneously (impressive!)

**Option C: Desktop + Mobile**
- Desktop: Your app
- Mobile: Messenger app (screen recorded)
- Use phone screen mirroring

---

## 🎤 Audio Script (Optional but Recommended)

If you're adding audio narration, use this script:

```
[0:00]
"Hello Facebook App Review team. This is the FB Messenger Agent platform."

[0:15]
"I'm now clicking 'Continue with Facebook' to authenticate."

[0:20]
"Notice the permission dialog shows all four requested permissions:
pages_show_list, pages_manage_metadata, pages_messaging, and business_management."

[0:30]
"After approving, the app retrieves my Facebook Pages using pages_show_list."

[0:45]
"Now I'll subscribe to webhooks using pages_manage_metadata."

[1:00]
"Next, I'll demonstrate sending a message. I'm typing a message here..."

[1:10]
"Clicking send, and now switching to Facebook Messenger..."

[1:20]
"As you can see, the message successfully appears in the Messenger inbox,
demonstrating the pages_messaging permission."

[1:45]
"The business_management permission was used during login to access my business account."

[2:00]
"All permissions have been successfully demonstrated. Thank you."
```

---

## 🚨 What Facebook Reviewers Are Looking For

Based on the rejection feedback you received, reviewers need to see:

1. **Visual proof of Facebook Login**
   - OAuth dialog with permissions
   - User approving permissions

2. **Page connection demonstration**
   - List of pages
   - Selection process
   - Connection confirmation

3. **Webhook setup demonstration**
   - Subscription action
   - Success confirmation
   - Settings configured

4. **End-to-end messaging**
   - Message sent from app
   - **Message received in Messenger inbox** ⭐
   - Not just showing the app interface!

5. **Business account integration**
   - Business selection/connection
   - Business info displayed

---

## 📤 Uploading Your Video

### Facebook App Review Portal:

1. Go to App Dashboard
2. Navigate to App Review → Permissions and Features
3. Click on each permission
4. Upload screencast (max 100MB)
5. Add description referencing timestamps:

**Example Description:**
```
Screencast demonstrating all requested permissions:

- 0:00-0:15: Introduction
- 0:15-0:45: Facebook OAuth authentication (all permissions visible)
- 0:45-1:00: pages_show_list - Page selection
- 1:00-1:15: pages_manage_metadata - Webhook subscription
- 1:15-2:00: pages_messaging - End-to-end message delivery
- 2:00-2:15: business_management - Business account access

Key timestamp: 1:20 - Message appearing in Messenger inbox
```

---

## ✅ Final Checks Before Submission

- [ ] Video clearly shows Facebook Login button
- [ ] Permission dialog is visible for 3+ seconds
- [ ] All 4 permissions are readable in dialog
- [ ] Page list is shown and clear
- [ ] Webhook subscription success message visible
- [ ] Message typed in app is clear and readable
- [ ] Send button click is visible
- [ ] **MESSENGER INBOX SCREEN IS SHOWN**
- [ ] **MESSAGE APPEARS IN MESSENGER**
- [ ] Business account info is visible (console or UI)
- [ ] Video has no glitches or errors
- [ ] Video is under 5 minutes
- [ ] Video file size is under 100MB
- [ ] Video format is supported (MP4/MOV/WebM)

---

## 🎉 You're Ready!

Follow this script exactly, and your app should be approved. The key is showing **actual evidence** of each permission working, especially the end-to-end messaging flow.

Good luck with your review! 🚀
