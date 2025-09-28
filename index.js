require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');
const ShopeeBot = require('./bot-logic');
const FacebookMessengerBot = require('./facebook-bot');
const DatabaseManager = require('./database-manager');
const AIIntelligence = require('./ai-intelligence');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and AI intelligence
const database = new DatabaseManager();
const aiIntelligence = new AIIntelligence(database);

// Initialize spreadsheet integration
async function initializeSpreadsheet() {
  try {
    const configPath = path.join(__dirname, 'spreadsheet-config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      if (config.google_sheets && config.google_sheets.enabled) {
        console.log('📊 Initializing Google Sheets integration...');
        const success = await aiIntelligence.initializeSpreadsheet(
          config.google_sheets.credentials,
          config.google_sheets.spreadsheet_id
        );

        if (success) {
          console.log('✅ Google Sheets integration enabled');

          // Set up daily analytics if configured
          if (config.analytics && config.analytics.daily_reports) {
            setInterval(async () => {
              try {
                await aiIntelligence.spreadsheetManager.generateAnalyticsReport();
                console.log('📈 Daily analytics report generated');
              } catch (error) {
                console.error('Error generating daily analytics:', error.message);
              }
            }, 24 * 60 * 60 * 1000); // 24 hours
          }
        } else {
          console.log('❌ Google Sheets integration failed - check credentials');
        }
      } else {
        console.log('📊 Google Sheets integration disabled in config');
      }
    } else {
      console.log('📊 No spreadsheet config found - copy spreadsheet-config.template.json to spreadsheet-config.json to enable');
    }
  } catch (error) {
    console.error('❌ Error initializing spreadsheet:', error.message);
  }
}

// Initialize spreadsheet on startup
initializeSpreadsheet();

// Initialize bots
const bot = new ShopeeBot(process.env.SHOP_NAME || 'Your Shop');
let facebookBot = null;

// Initialize Facebook bot if credentials are available
if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_VERIFY_TOKEN) {
  const BusinessConfig = require('./business-config');
  const businessConfig = BusinessConfig.getDemoConfig();

  facebookBot = new FacebookMessengerBot(
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    process.env.FACEBOOK_VERIFY_TOKEN,
    process.env.SHOP_NAME || 'Your Shop',
    businessConfig
  );
  console.log('🤖 AI-powered Facebook Messenger bot initialized with demo config');
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
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FB Messenger Agent - SaaS Platform</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                background: linear-gradient(135deg, #ff6b35 0%, #4f46e5 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .container {
                text-align: center;
                max-width: 600px;
                padding: 40px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 20px;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            .subtitle {
                font-size: 1.2rem;
                margin-bottom: 30px;
                opacity: 0.9;
            }
            .status {
                background: rgba(16, 185, 129, 0.2);
                border: 1px solid rgba(16, 185, 129, 0.5);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            .links {
                display: flex;
                gap: 20px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .btn {
                padding: 15px 30px;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
            }
            .btn-primary {
                background: white;
                color: #ff6b35;
            }
            .btn-secondary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }
            .info {
                margin-top: 40px;
                font-size: 14px;
                opacity: 0.8;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 20px;
                    padding: 30px 20px;
                }
                h1 {
                    font-size: 2rem;
                }
                .links {
                    flex-direction: column;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>💬 FB Messenger Agent</h1>
            <div class="subtitle">Intelligent Sales Assistant SaaS Platform</div>

            <div class="status">
                ✅ Agent is running and ready to help customers!<br>
                <strong>Shop:</strong> ${process.env.SHOP_NAME || 'Your Shop'}<br>
                <strong>Version:</strong> 1.0.0
            </div>

            <div class="links">
                <a href="/setup" class="btn btn-primary">
                    🧙‍♂️ Setup Wizard
                </a>
                <a href="/dashboard" class="btn btn-secondary">
                    📊 Seller Dashboard
                </a>
                <a href="/test.html" class="btn btn-secondary">
                    🧪 Test Agent
                </a>
            </div>

            <div class="info">
                <strong>For Sellers:</strong> Use the dashboard to manage products, FAQs, and view customer leads<br>
                <strong>For Customers:</strong> Chat with our AI agent on Facebook Messenger
            </div>
        </div>
    </body>
    </html>
  `);
});

// Test page route
app.get('/test.html', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

// Enhanced test interface route
app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test-interface.html');
});

// Seller Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

// Dashboard JavaScript route
app.get('/dashboard.js', (req, res) => {
  res.sendFile(__dirname + '/dashboard.js');
});

// Business Setup Wizard routes
app.get('/setup', (req, res) => {
  res.sendFile(__dirname + '/business-setup-wizard.html');
});

// Smart Import Wizard route
app.get('/smart-import', (req, res) => {
  res.sendFile(__dirname + '/smart-import-wizard.html');
});

app.get('/business-setup-wizard.js', (req, res) => {
  res.sendFile(__dirname + '/business-setup-wizard.js');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Legacy Shopee webhook endpoint (deprecated - focusing on FB Messenger)
app.post('/webhook/shopee/chat', (req, res) => {
  res.status(410).json({
    error: 'Shopee integration deprecated. Please use Facebook Messenger integration.',
    redirect: '/webhook/facebook'
  });
});

// Manual test endpoint for bot responses
app.post('/test/message', async (req, res) => {
  const { message, userName = 'TestUser' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Use new AI Intelligence system
    const businessConfig = await database.getBusinessConfig() || {};

    // Add products and FAQs from database to config
    businessConfig.products = await database.getAllProducts();
    businessConfig.faqs = await database.getAllFAQs();

    const result = await aiIntelligence.processMessage(
      `test_user_${Date.now()}`,
      message,
      businessConfig
    );

    res.json({
      input: message,
      response: result.response,
      analysis: result.analysis,
      leadScore: result.leadScore,
      mentionedProducts: result.mentionedProducts,
      urgency: result.urgency,
      aiPowered: true,
      intelligence: 'Enhanced AI with learning capabilities'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);

    // Fallback to simple bot on error
    const response = bot.processMessage(message, userName);
    const interaction = bot.logCustomerInteraction(userName, message, response);

    res.json({
      input: message,
      response: response,
      interaction: interaction,
      error: error.message,
      aiPowered: false
    });
  }
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

// Get AI-powered leads dashboard
app.get('/leads', (req, res) => {
  try {
    if (!facebookBot || !facebookBot.leadManager) {
      return res.status(400).json({ error: 'Lead manager not available' });
    }

    const filter = {
      urgency: req.query.urgency,
      status: req.query.status
    };

    const leads = facebookBot.leadManager.getAllLeads(filter);
    const analytics = facebookBot.leadManager.getAnalytics();

    res.json({
      success: true,
      analytics: analytics,
      leads: leads,
      totalLeads: leads.length
    });
  } catch (error) {
    console.error('Leads endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get specific lead details
app.get('/leads/:leadId', (req, res) => {
  try {
    if (!facebookBot || !facebookBot.leadManager) {
      return res.status(400).json({ error: 'Lead manager not available' });
    }

    const leadId = req.params.leadId;
    const lead = facebookBot.leadManager.leads.get(leadId);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      success: true,
      lead: lead
    });
  } catch (error) {
    console.error('Lead detail error:', error);
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
});

// Get business configuration
app.get('/config/business', async (req, res) => {
  try {
    let config = await database.getBusinessConfig();

    if (!config) {
      // Return default config if none exists
      const BusinessConfig = require('./business-config');
      const defaultConfig = new BusinessConfig();
      config = defaultConfig.getDefaultConfig();
    }

    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('Business config error:', error);
    res.status(500).json({ error: 'Failed to fetch business config' });
  }
});

// Update business configuration
app.post('/config/business', async (req, res) => {
  try {
    const BusinessConfig = require('./business-config');
    let config = new BusinessConfig();

    // Get existing config or use default
    const existingConfig = await database.getBusinessConfig();
    if (existingConfig) {
      config.config = existingConfig;
    }

    // Update configuration from request
    if (req.body.basicInfo) {
      config.updateBasicInfo(
        req.body.basicInfo.shopName,
        req.body.basicInfo.businessType,
        req.body.basicInfo.location,
        req.body.basicInfo.description
      );
    }

    // Handle direct config object update
    if (req.body.shopName) {
      config.config.shopName = req.body.shopName;
    }
    if (req.body.businessType) {
      config.config.businessType = req.body.businessType;
    }
    if (req.body.location) {
      config.config.location = req.body.location;
    }
    if (req.body.businessInfo) {
      config.config.businessInfo = { ...config.config.businessInfo, ...req.body.businessInfo };
    }

    // Save to database
    await database.saveBusinessConfig(config.config);

    // Handle products
    if (req.body.products) {
      for (const product of req.body.products) {
        await database.saveProduct(product);
      }
    }

    // Handle FAQs
    if (req.body.faqs) {
      for (const faq of req.body.faqs) {
        await database.saveFAQ(faq);
      }
    }

    // Reinitialize bot with new configuration
    if (facebookBot) {
      facebookBot.businessConfig = config.getAIConfig();
      if (facebookBot.aiEngine) {
        facebookBot.aiEngine = new (require('./ai-engine'))(facebookBot.businessConfig);
      }
      console.log('🔄 Business configuration updated and saved to database');
    }

    res.json({
      success: true,
      message: 'Business configuration updated and saved',
      config: config.getAIConfig()
    });
  } catch (error) {
    console.error('Business config update error:', error);
    res.status(500).json({ error: 'Failed to update business config' });
  }
});

// Get dashboard statistics with AI-powered analytics
app.get('/dashboard/stats', async (req, res) => {
  try {
    // Get analytics from database
    const analytics = await database.getAnalytics();
    const leads = await database.getAllLeads();

    // Calculate enhanced metrics
    const totalInteractions = analytics.totalInteractions;
    const totalLeads = leads.length;
    const hotLeads = leads.filter(lead => lead.urgency === 'high').length;
    const conversionRate = totalInteractions > 0 ? ((totalLeads / totalInteractions) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalInteractions,
        totalLeads,
        hotLeads,
        conversionRate: parseFloat(conversionRate),
        uniqueCustomers: analytics.uniqueCustomers,
        avgLeadScore: analytics.avgLeadScore?.toFixed(1) || 0,
        avgSatisfaction: analytics.avgSatisfaction?.toFixed(1) || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Get product performance analytics
app.get('/analytics/products', async (req, res) => {
  try {
    const productInsights = await database.getProductInsights();

    res.json({
      success: true,
      products: productInsights,
      summary: {
        totalProducts: productInsights.length,
        avgMentions: productInsights.reduce((sum, p) => sum + p.performance.mentions, 0) / productInsights.length || 0,
        topPerformer: productInsights[0]?.name || 'None'
      }
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ error: 'Failed to get product analytics' });
  }
});

// Get conversation intelligence insights
app.get('/analytics/conversations', async (req, res) => {
  try {
    const insights = await database.generateConversationInsights();

    res.json({
      success: true,
      insights: insights,
      summary: {
        topIntents: insights.slice(0, 3).map(i => i.intent),
        avgSatisfaction: insights.reduce((sum, i) => sum + (i.avgSatisfaction || 0), 0) / insights.length || 0,
        totalConversations: insights.reduce((sum, i) => sum + i.frequency, 0)
      }
    });
  } catch (error) {
    console.error('Conversation analytics error:', error);
    res.status(500).json({ error: 'Failed to get conversation analytics' });
  }
});

// Get spreadsheet configuration status
app.get('/config/spreadsheet', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'spreadsheet-config.json');
    const templatePath = path.join(__dirname, 'spreadsheet-config.template.json');

    let config = {};
    let hasConfig = false;

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      hasConfig = true;
    }

    res.json({
      success: true,
      hasConfig,
      enabled: config.google_sheets?.enabled || false,
      isInitialized: aiIntelligence.spreadsheetManager?.isInitialized || false,
      templateAvailable: fs.existsSync(templatePath),
      status: {
        configured: hasConfig,
        enabled: config.google_sheets?.enabled || false,
        connected: aiIntelligence.spreadsheetManager?.isInitialized || false
      }
    });
  } catch (error) {
    console.error('Spreadsheet config error:', error);
    res.status(500).json({ error: 'Failed to get spreadsheet configuration' });
  }
});

// Update spreadsheet configuration
app.post('/config/spreadsheet', async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'spreadsheet-config.json');
    let config = {};

    // Load existing config if it exists
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      // Load template as base
      const templatePath = path.join(__dirname, 'spreadsheet-config.template.json');
      config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    }

    // Update config with request data
    if (req.body.google_sheets) {
      config.google_sheets = { ...config.google_sheets, ...req.body.google_sheets };
    }

    if (req.body.analytics) {
      config.analytics = { ...config.analytics, ...req.body.analytics };
    }

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Reinitialize if enabled
    if (config.google_sheets.enabled) {
      const success = await aiIntelligence.initializeSpreadsheet(
        config.google_sheets.credentials,
        config.google_sheets.spreadsheet_id
      );

      res.json({
        success: true,
        message: 'Spreadsheet configuration updated',
        connected: success,
        config: config
      });
    } else {
      res.json({
        success: true,
        message: 'Spreadsheet configuration updated (disabled)',
        connected: false,
        config: config
      });
    }

  } catch (error) {
    console.error('Spreadsheet config update error:', error);
    res.status(500).json({ error: 'Failed to update spreadsheet configuration' });
  }
});

// Generate analytics report manually
app.post('/analytics/generate', async (req, res) => {
  try {
    if (!aiIntelligence.spreadsheetManager?.isInitialized) {
      return res.status(400).json({ error: 'Spreadsheet not configured' });
    }

    const analytics = await aiIntelligence.spreadsheetManager.generateAnalyticsReport();

    res.json({
      success: true,
      message: 'Analytics report generated',
      analytics: analytics
    });
  } catch (error) {
    console.error('Analytics generation error:', error);
    res.status(500).json({ error: 'Failed to generate analytics report' });
  }
});

// Create spreadsheet backup
app.post('/backup/spreadsheet', async (req, res) => {
  try {
    if (!aiIntelligence.spreadsheetManager?.isInitialized) {
      return res.status(400).json({ error: 'Spreadsheet not configured' });
    }

    const backupPath = await aiIntelligence.spreadsheetManager.createBackup();

    if (backupPath) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backupPath: backupPath
      });
    } else {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Smart Import routes
const SmartImportProcessor = require('./smart-import');
const smartImport = new SmartImportProcessor();

// Serve smart import interface
app.get('/import', (req, res) => {
  res.sendFile(__dirname + '/smart-import.html');
});

// Process text import
app.post('/api/smart-import/text', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    console.log('🧠 Processing text import...');
    const extractedData = await smartImport.processText(content);

    res.json({
      success: true,
      data: extractedData,
      message: 'Successfully processed text content'
    });

  } catch (error) {
    console.error('Smart import text error:', error);
    res.status(500).json({ error: 'Failed to process text content' });
  }
});

// Process file uploads
app.post('/api/smart-import/files', async (req, res) => {
  try {
    // This would handle file uploads with multer middleware
    // For now, return placeholder
    res.json({
      success: true,
      data: {
        business_info: { name: "File Import Demo" },
        products: [],
        faqs: [],
        note: "File processing will be implemented with multer middleware"
      },
      message: 'File processing endpoint ready'
    });

  } catch (error) {
    console.error('Smart import file error:', error);
    res.status(500).json({ error: 'Failed to process files' });
  }
});

// Process website import
app.post('/api/smart-import/website', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('🌐 Processing website:', url);
    const processor = new SmartImportProcessor();
    const extractedData = await processor.processWebsite(url);

    res.json({
      success: true,
      data: extractedData,
      message: 'Successfully processed website content'
    });

  } catch (error) {
    console.error('Smart import website error:', error);
    res.status(500).json({ error: 'Failed to process website' });
  }
});

// === CONVERSION TRACKING AND ANALYTICS ENDPOINTS ===

// Get conversion analytics report
app.get('/analytics/conversion', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const report = await aiIntelligence.conversionTracker.generateAnalyticsReport(timeframe);

    if (report) {
      res.json({
        success: true,
        report: report
      });
    } else {
      res.status(500).json({ error: 'Failed to generate conversion analytics' });
    }
  } catch (error) {
    console.error('Conversion analytics error:', error);
    res.status(500).json({ error: 'Failed to get conversion analytics' });
  }
});

// Get real-time conversion metrics
app.get('/analytics/conversion/realtime', (req, res) => {
  try {
    const metrics = aiIntelligence.conversionTracker.getRealTimeMetrics();

    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({ error: 'Failed to get real-time metrics' });
  }
});

// Get customer journey details
app.get('/analytics/journey/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const journey = aiIntelligence.conversionTracker.conversions.get(customerId);

    if (journey) {
      res.json({
        success: true,
        journey: {
          customerId: journey.customerId,
          startDate: journey.startDate,
          currentStage: journey.currentStage,
          status: journey.status,
          metrics: journey.metrics,
          funnel: journey.funnel,
          products: {
            viewed: Array.from(journey.products.viewed),
            inquired: Array.from(journey.products.inquired),
            ordered: Array.from(journey.products.ordered)
          },
          tags: Array.from(journey.tags),
          interactions: journey.interactions.slice(-10) // Last 10 interactions
        }
      });
    } else {
      res.status(404).json({ error: 'Customer journey not found' });
    }
  } catch (error) {
    console.error('Customer journey error:', error);
    res.status(500).json({ error: 'Failed to get customer journey' });
  }
});

// Get conversion funnel analysis
app.get('/analytics/funnel', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const report = await aiIntelligence.conversionTracker.generateAnalyticsReport(timeframe);

    if (report) {
      res.json({
        success: true,
        funnel: report.funnel,
        recommendations: report.recommendations.filter(r => r.type === 'funnel_optimization')
      });
    } else {
      res.status(500).json({ error: 'Failed to generate funnel analysis' });
    }
  } catch (error) {
    console.error('Funnel analysis error:', error);
    res.status(500).json({ error: 'Failed to get funnel analysis' });
  }
});

// Get product performance analytics
app.get('/analytics/products/conversion', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const report = await aiIntelligence.conversionTracker.generateAnalyticsReport(timeframe);

    if (report) {
      res.json({
        success: true,
        products: report.products,
        recommendations: report.recommendations.filter(r => r.type === 'product_optimization')
      });
    } else {
      res.status(500).json({ error: 'Failed to generate product conversion analytics' });
    }
  } catch (error) {
    console.error('Product conversion analytics error:', error);
    res.status(500).json({ error: 'Failed to get product conversion analytics' });
  }
});

// Get customer segmentation analytics
app.get('/analytics/segments', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const report = await aiIntelligence.conversionTracker.generateAnalyticsReport(timeframe);

    if (report) {
      res.json({
        success: true,
        segments: report.segments,
        trends: report.trends
      });
    } else {
      res.status(500).json({ error: 'Failed to generate segmentation analytics' });
    }
  } catch (error) {
    console.error('Segmentation analytics error:', error);
    res.status(500).json({ error: 'Failed to get segmentation analytics' });
  }
});

// Get conversion events for a customer
app.get('/analytics/events/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const eventType = req.query.type || null;

    const events = await database.getConversionEvents(customerId, eventType);

    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    console.error('Conversion events error:', error);
    res.status(500).json({ error: 'Failed to get conversion events' });
  }
});

// Get analytics reports history
app.get('/analytics/reports', async (req, res) => {
  try {
    const reportType = req.query.type || null;
    const limit = parseInt(req.query.limit) || 10;

    const reports = await database.getAnalyticsReports(reportType, limit);

    res.json({
      success: true,
      reports: reports
    });
  } catch (error) {
    console.error('Analytics reports error:', error);
    res.status(500).json({ error: 'Failed to get analytics reports' });
  }
});

// Facebook Messenger webhook verification (GET)
app.get('/webhook/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request:');
  console.log('Mode:', mode);
  console.log('Token received:', token);
  console.log('Expected token:', process.env.FACEBOOK_VERIFY_TOKEN);
  console.log('Challenge:', challenge);
  console.log('Facebook bot configured:', !!facebookBot);

  // If no parameters, return a friendly message
  if (!mode && !token && !challenge) {
    return res.status(200).send('Webhook endpoint is ready. Use proper verification parameters.');
  }

  // Check if required parameters are missing
  if (!mode || !token || !challenge) {
    console.log('Missing required verification parameters');
    return res.status(400).send('Missing required verification parameters: hub.mode, hub.verify_token, hub.challenge');
  }

  if (facebookBot) {
    const result = facebookBot.verifyWebhook(mode, token, challenge);
    console.log('Verification result:', result);
    if (result) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Verification failed - invalid token or mode');
    }
  } else {
    res.status(500).send('Facebook bot not configured');
  }
});

// Facebook Messenger webhook for receiving messages (POST)
app.post('/webhook/facebook', async (req, res) => {
  try {
    console.log('📥 Received Facebook webhook:', JSON.stringify(req.body, null, 2));

    if (!facebookBot) {
      console.error('❌ Facebook bot not configured');
      return res.status(500).json({ error: 'Facebook bot not configured' });
    }

    const body = req.body;

    if (body.object === 'page') {
      console.log('✅ Processing page webhook events');
      // Process each messaging event
      for (const entry of body.entry) {
        console.log('📨 Processing entry:', entry.id);
        for (const event of entry.messaging) {
          console.log('💬 Processing messaging event:', JSON.stringify(event, null, 2));

          if (event.message) {
            console.log('📝 Processing message from:', event.sender.id);

            // Process with AI Intelligence
            const businessConfig = await database.getBusinessConfig() || {};
            const result = await aiIntelligence.processMessage(
              event.sender.id,
              event.message.text,
              businessConfig
            );

            // Send AI response back to user
            if (facebookBot) {
              await facebookBot.sendMessage(event.sender.id, result.response);
            }

            // Save lead if score is high enough
            if (result.leadScore >= 10) {
              const lead = {
                id: `lead_${event.sender.id}_${Date.now()}`,
                customerId: event.sender.id,
                customerName: `Customer_${event.sender.id}`,
                leadScore: result.leadScore,
                urgencyLevel: result.urgency,
                status: 'new',
                interestedProducts: result.mentionedProducts?.map(p => p.name) || [],
                lastMessage: event.message.text,
                conversionProbability: result.leadScore / 100,
                estimatedValue: result.mentionedProducts?.reduce((sum, p) => sum + p.price, 0) || 0
              };

              await database.saveLead(lead);
              console.log('🎯 New lead saved:', lead.leadScore);
            }

            console.log('✅ AI-powered interaction processed');
          } else if (event.postback) {
            console.log('🔘 Processing postback:', event.postback.payload);
            // Button/quick reply postback
            await facebookBot.processPostback(event);
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      console.log('❌ Not a page webhook:', body.object);
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('❌ Facebook webhook error:', error);
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

  // Reinitialize Facebook bot with business configuration
  const BusinessConfig = require('./business-config');
  let businessConfig = null;

  // Try to get existing business config or use demo
  try {
    businessConfig = facebookBot ? facebookBot.businessConfig : BusinessConfig.getDemoConfig();
  } catch (error) {
    businessConfig = BusinessConfig.getDemoConfig();
  }

  facebookBot = new FacebookMessengerBot(
    page_access_token,
    verify_token,
    shop_name || process.env.SHOP_NAME || 'Your Shop',
    businessConfig
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

// Legacy Shopee API configuration (deprecated)
app.post('/config/shopee', (req, res) => {
  res.status(410).json({
    error: 'Shopee integration deprecated. Please use Facebook Messenger configuration.',
    redirect: '/config/facebook'
  });
});

// Legacy Shopee functions (deprecated - keeping for compatibility)
function verifyShopeeSignature(req) {
  console.log('⚠️ Shopee integration deprecated. Use Facebook Messenger instead.');
  return false;
}

async function sendShopeeMessage(conversationId, message, shopId) {
  console.log('⚠️ Shopee integration deprecated. Use Facebook Messenger instead.');
  return { success: false, error: 'Shopee integration deprecated' };
}

// Start server
app.listen(PORT, () => {
  console.log(`FB Messenger Agent server is running on port ${PORT}`);
  console.log(`Shop Name: ${process.env.SHOP_NAME || 'Your Shop'}`);
  console.log(`Test the agent at: http://localhost:${PORT}/test/message`);
});