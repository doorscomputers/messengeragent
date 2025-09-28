# 📊 Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for automatic order and lead logging.

## Overview

The spreadsheet integration automatically logs:
- **Orders**: Customer orders with details, status, and lead scores
- **Leads**: Customer leads with scoring, buying stage, and tags
- **Analytics**: Daily analytics reports with conversion tracking

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in service account details:
   - Name: `fb-messenger-agent`
   - Description: `Service account for FB Messenger Agent spreadsheet integration`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

## Step 3: Generate Credentials

1. Find your service account in the credentials list
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Choose "JSON" format
6. Click "Create" - this downloads the credentials file

## Step 4: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it something like "FB Messenger Agent Data"
4. Share the spreadsheet with your service account:
   - Click "Share" button
   - Add your service account email (from the credentials file)
   - Give "Editor" permissions
   - Uncheck "Notify people"
   - Click "Share"
5. Copy the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## Step 5: Configure Integration

1. Copy the configuration template:
   ```bash
   cp spreadsheet-config.template.json spreadsheet-config.json
   ```

2. Open `spreadsheet-config.json` and update:

   ```json
   {
     "google_sheets": {
       "enabled": true,
       "credentials": {
         // Paste the contents of your downloaded JSON credentials file here
       },
       "spreadsheet_id": "YOUR_SPREADSHEET_ID_HERE",
       "backup_enabled": true,
       "backup_interval_hours": 24
     },
     "analytics": {
       "enabled": true,
       "daily_reports": true,
       "conversion_tracking": true
     }
   }
   ```

3. Replace the credentials object with your actual service account credentials
4. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual spreadsheet ID

## Step 6: Restart the Application

1. Restart your FB Messenger Agent:
   ```bash
   npm start
   ```

2. Check the console for success messages:
   ```
   📊 Initializing Google Sheets integration...
   ✅ Created sheet: Orders
   ✅ Created sheet: Leads
   ✅ Created sheet: Analytics
   ✅ Google Sheets integration enabled
   ```

## Step 7: Test the Integration

1. Send a test message through your Facebook Messenger bot
2. Check your Google Spreadsheet - you should see:
   - New lead entry in "Leads" sheet
   - If it's an order, entry in "Orders" sheet
   - Daily analytics in "Analytics" sheet

## Configuration Options

### Google Sheets Settings
- `enabled`: Enable/disable the integration
- `credentials`: Service account credentials (JSON object)
- `spreadsheet_id`: Your Google Spreadsheet ID
- `backup_enabled`: Enable automatic backups
- `backup_interval_hours`: Backup frequency

### Analytics Settings
- `enabled`: Enable analytics logging
- `daily_reports`: Generate daily analytics reports
- `conversion_tracking`: Track conversion metrics

## API Endpoints

Once configured, you can use these endpoints:

- `GET /config/spreadsheet` - Check configuration status
- `POST /config/spreadsheet` - Update configuration
- `POST /analytics/generate` - Generate analytics report manually
- `POST /backup/spreadsheet` - Create manual backup

## Spreadsheet Structure

The integration automatically creates three sheets:

### Orders Sheet
| Column | Description |
|--------|-------------|
| Timestamp | When the order was placed |
| Customer ID | Unique customer identifier |
| Customer Name | Customer's name (if available) |
| Contact Info | Phone/email (if extracted) |
| Products | List of ordered products |
| Quantity | Order quantity |
| Total Amount | Order total (if calculated) |
| Status | Order status (pending, confirmed, etc.) |
| Priority | Lead priority (high, medium, low) |
| Lead Score | AI-calculated lead score (0-100) |
| Tags | Customer behavior tags |

### Leads Sheet
| Column | Description |
|--------|-------------|
| Timestamp | When the lead was identified |
| Customer ID | Unique customer identifier |
| Customer Name | Customer's name (if available) |
| Contact Info | Phone/email (if extracted) |
| Lead Score | AI-calculated lead score (0-100) |
| Buying Stage | awareness, research, consideration, decision |
| Interest Level | very_high, high, medium, low, very_low |
| Priority | high, medium, low |
| Tags | Behavior and classification tags |
| Last Message | Customer's most recent message |
| Conversion Status | lead or customer |

### Analytics Sheet
| Column | Description |
|--------|-------------|
| Date | Report date |
| Total Messages | Messages received that day |
| New Leads | New leads identified |
| Orders | Orders placed |
| Conversion Rate | Lead to order conversion rate |
| Avg Lead Score | Average lead score |
| Top Products | Most mentioned products |

## Troubleshooting

### Common Issues

1. **"Spreadsheet not configured" error**
   - Check that `spreadsheet-config.json` exists
   - Verify `enabled: true` in the config
   - Restart the application

2. **"Authentication failed" error**
   - Verify service account credentials are correct
   - Check that the service account has access to the spreadsheet
   - Ensure Google Sheets API is enabled

3. **"Spreadsheet not found" error**
   - Verify the spreadsheet ID is correct
   - Check that the spreadsheet is shared with the service account
   - Ensure the spreadsheet exists and is accessible

4. **No data appearing in sheets**
   - Test with a Facebook Messenger conversation
   - Check console logs for errors
   - Verify the bot is processing messages correctly

### Logs and Debugging

Check console output for these messages:
- `✅ Google Sheets integration enabled` - Integration working
- `❌ Google Sheets integration failed` - Check credentials
- `📊 Order logged to spreadsheet` - Order successfully logged
- `📊 Lead logged to spreadsheet` - Lead successfully logged

## Security Notes

- Keep your `spreadsheet-config.json` file secure
- Never commit credentials to version control
- Consider using environment variables for production
- Regularly rotate service account keys
- Monitor spreadsheet access logs

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Test with the manual API endpoints
4. Verify your Google Cloud setup

For additional help, check the main documentation or create an issue in the project repository.