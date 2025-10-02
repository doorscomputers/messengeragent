// Database Manager for FB Messenger Agent
// Handles persistent storage and AI learning data

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor(dbPath = './messenger_agent.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        console.log('🗄️ Initializing Database Manager...');

        // Create database directory if it doesn't exist
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Initialize database connection
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Database connection error:', err);
            } else {
                console.log('✅ Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const tables = [
            // Business Configurations
            `CREATE TABLE IF NOT EXISTS business_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shop_name TEXT NOT NULL,
                business_type TEXT,
                location TEXT,
                description TEXT,
                contact_info TEXT,
                payment_methods TEXT,
                business_hours TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Products Catalog
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT,
                category TEXT,
                stock INTEGER DEFAULT 0,
                keywords TEXT,
                specifications TEXT,
                images TEXT,
                performance_score REAL DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                inquiry_count INTEGER DEFAULT 0,
                conversion_rate REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // FAQ Database
            `CREATE TABLE IF NOT EXISTS faqs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                faq_id TEXT UNIQUE NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                keywords TEXT,
                usage_count INTEGER DEFAULT 0,
                effectiveness_score REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Customer Interactions (AI Learning Data)
            `CREATE TABLE IF NOT EXISTS customer_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT NOT NULL,
                customer_name TEXT,
                message TEXT NOT NULL,
                bot_response TEXT NOT NULL,
                intent TEXT,
                sentiment TEXT,
                satisfaction_score REAL,
                lead_score INTEGER DEFAULT 0,
                urgency_level TEXT DEFAULT 'medium',
                products_mentioned TEXT,
                topics_discussed TEXT,
                conversation_stage TEXT,
                session_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Leads Management
            `CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id TEXT UNIQUE NOT NULL,
                customer_id TEXT NOT NULL,
                customer_name TEXT,
                phone TEXT,
                email TEXT,
                lead_score INTEGER NOT NULL,
                urgency_level TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                interested_products TEXT,
                last_message TEXT,
                notes TEXT,
                assigned_to TEXT,
                follow_up_date DATETIME,
                conversion_probability REAL,
                estimated_value REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // AI Learning Patterns
            `CREATE TABLE IF NOT EXISTS ai_learning_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_type TEXT NOT NULL,
                input_pattern TEXT NOT NULL,
                successful_response TEXT NOT NULL,
                context TEXT,
                success_rate REAL DEFAULT 0,
                usage_count INTEGER DEFAULT 0,
                confidence_score REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Performance Analytics
            `CREATE TABLE IF NOT EXISTS analytics_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_type TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metadata TEXT,
                date_recorded DATE DEFAULT CURRENT_DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Facebook Pages (for OAuth and webhook management)
            `CREATE TABLE IF NOT EXISTS facebook_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT UNIQUE NOT NULL,
                page_name TEXT NOT NULL,
                page_access_token TEXT NOT NULL,
                user_id TEXT NOT NULL,
                category TEXT,
                webhook_subscribed INTEGER DEFAULT 0,
                webhook_subscribed_at DATETIME,
                connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Conversation Intelligence
            `CREATE TABLE IF NOT EXISTS conversation_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                insight_type TEXT NOT NULL,
                customer_segment TEXT,
                common_questions TEXT,
                successful_responses TEXT,
                pain_points TEXT,
                improvement_suggestions TEXT,
                confidence_level REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Order Sessions for order processing workflow
            `CREATE TABLE IF NOT EXISTS order_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                customer_id TEXT NOT NULL,
                state TEXT NOT NULL,
                products TEXT,
                customer_info TEXT,
                order_details TEXT,
                total_amount REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Final Orders table
            `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE NOT NULL,
                order_number TEXT UNIQUE NOT NULL,
                customer_id TEXT NOT NULL,
                customer_name TEXT,
                customer_phone TEXT,
                customer_email TEXT,
                products TEXT NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'confirmed',
                order_details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Customer Tags for lead classification
            `CREATE TABLE IF NOT EXISTS customer_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT NOT NULL,
                category TEXT NOT NULL,
                tag TEXT NOT NULL,
                priority TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(customer_id, category, tag)
            )`,

            // Customer Profiles for comprehensive customer insights
            `CREATE TABLE IF NOT EXISTS customer_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT UNIQUE NOT NULL,
                buying_stage TEXT,
                interest_level TEXT,
                customer_type TEXT,
                priority_level TEXT,
                is_urgent INTEGER DEFAULT 0,
                is_price_conscious INTEGER DEFAULT 0,
                is_returning_customer INTEGER DEFAULT 0,
                lead_score INTEGER DEFAULT 0,
                sentiment TEXT,
                confidence REAL DEFAULT 0,
                recommended_actions TEXT,
                next_best_action TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Customer Journeys for conversion tracking
            `CREATE TABLE IF NOT EXISTS customer_journeys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT UNIQUE NOT NULL,
                start_date DATETIME NOT NULL,
                current_stage TEXT DEFAULT 'awareness',
                status TEXT DEFAULT 'active',
                last_interaction DATETIME,
                total_interactions INTEGER DEFAULT 0,
                average_lead_score REAL DEFAULT 0,
                peak_lead_score INTEGER DEFAULT 0,
                engagement_score INTEGER DEFAULT 0,
                time_to_conversion INTEGER,
                conversion_value REAL DEFAULT 0,
                funnel_data TEXT,
                products_data TEXT,
                tags_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Journey Interactions for detailed tracking
            `CREATE TABLE IF NOT EXISTS journey_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journey_id INTEGER NOT NULL,
                customer_id TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                message TEXT,
                response TEXT,
                lead_score INTEGER,
                intent TEXT,
                order_status TEXT,
                products TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (journey_id) REFERENCES customer_journeys(id)
            )`,

            // Conversion Events for tracking specific milestones
            `CREATE TABLE IF NOT EXISTS conversion_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                event_data TEXT,
                journey_stage TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Lead Score History for tracking score changes
            `CREATE TABLE IF NOT EXISTS lead_score_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                timestamp DATETIME NOT NULL,
                score_change INTEGER DEFAULT 0,
                trigger_event TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Analytics Reports for storing generated reports
            `CREATE TABLE IF NOT EXISTS analytics_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_type TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                report_data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        tables.forEach((sql, index) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Error creating table ${index + 1}:`, err);
                } else {
                    console.log(`✅ Table ${index + 1} created/verified`);
                }
            });
        });

        // Create indexes for better performance
        this.createIndexes();
    }

    createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON customer_interactions(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_customer_interactions_timestamp ON customer_interactions(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC)',
            'CREATE INDEX IF NOT EXISTS idx_leads_urgency ON leads(urgency_level)',
            'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_data(date_recorded)',
            'CREATE INDEX IF NOT EXISTS idx_ai_patterns_type ON ai_learning_patterns(pattern_type)',
            'CREATE INDEX IF NOT EXISTS idx_customer_journeys_customer_id ON customer_journeys(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_customer_journeys_status ON customer_journeys(status)',
            'CREATE INDEX IF NOT EXISTS idx_customer_journeys_stage ON customer_journeys(current_stage)',
            'CREATE INDEX IF NOT EXISTS idx_journey_interactions_customer_id ON journey_interactions(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_journey_interactions_timestamp ON journey_interactions(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_conversion_events_customer_id ON conversion_events(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type)',
            'CREATE INDEX IF NOT EXISTS idx_lead_score_history_customer_id ON lead_score_history(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(report_type)'
        ];

        indexes.forEach(sql => {
            this.db.run(sql, (err) => {
                if (err && !err.message.includes('already exists')) {
                    console.error('❌ Error creating index:', err);
                }
            });
        });
    }

    // Business Configuration Methods
    async saveBusinessConfig(config) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO business_configs
                (shop_name, business_type, location, description, contact_info, payment_methods, business_hours, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            const values = [
                config.shopName,
                config.businessType,
                config.location,
                config.businessInfo?.description,
                JSON.stringify(config.businessInfo?.contactInfo || {}),
                JSON.stringify(config.businessInfo?.paymentMethods || []),
                config.businessInfo?.businessHours
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving business config:', err);
                    reject(err);
                } else {
                    console.log('✅ Business config saved');
                    resolve(this.lastID);
                }
            });
        });
    }

    async getBusinessConfig() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM business_configs ORDER BY updated_at DESC LIMIT 1';

            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    const config = {
                        shopName: row.shop_name,
                        businessType: row.business_type,
                        location: row.location,
                        businessInfo: {
                            description: row.description,
                            contactInfo: JSON.parse(row.contact_info || '{}'),
                            paymentMethods: JSON.parse(row.payment_methods || '[]'),
                            businessHours: row.business_hours
                        }
                    };
                    resolve(config);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Product Management Methods
    async saveProduct(product) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO products
                (product_id, name, price, description, category, stock, keywords, specifications, images, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            const values = [
                product.id || product.product_id,
                product.name,
                product.price,
                product.description,
                product.category,
                product.stock,
                JSON.stringify(product.keywords || []),
                JSON.stringify(product.specifications || {}),
                JSON.stringify(product.images || [])
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving product:', err);
                    reject(err);
                } else {
                    console.log('✅ Product saved:', product.name);
                    resolve(this.lastID);
                }
            });
        });
    }

    async getAllProducts() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products ORDER BY updated_at DESC';

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const products = rows.map(row => ({
                        id: row.product_id,
                        name: row.name,
                        price: row.price,
                        description: row.description,
                        category: row.category,
                        stock: row.stock,
                        keywords: JSON.parse(row.keywords || '[]'),
                        specifications: JSON.parse(row.specifications || '{}'),
                        images: JSON.parse(row.images || '[]'),
                        performance: {
                            score: row.performance_score,
                            views: row.view_count,
                            inquiries: row.inquiry_count,
                            conversionRate: row.conversion_rate
                        }
                    }));
                    resolve(products);
                }
            });
        });
    }

    // FAQ Management Methods
    async saveFAQ(faq) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO faqs
                (faq_id, question, answer, keywords, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            const values = [
                faq.id || faq.faq_id,
                faq.question,
                faq.answer,
                JSON.stringify(faq.keywords || [])
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving FAQ:', err);
                    reject(err);
                } else {
                    console.log('✅ FAQ saved');
                    resolve(this.lastID);
                }
            });
        });
    }

    async getAllFAQs() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM faqs ORDER BY usage_count DESC, updated_at DESC';

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const faqs = rows.map(row => ({
                        id: row.faq_id,
                        question: row.question,
                        answer: row.answer,
                        keywords: JSON.parse(row.keywords || '[]'),
                        performance: {
                            usageCount: row.usage_count,
                            effectiveness: row.effectiveness_score
                        }
                    }));
                    resolve(faqs);
                }
            });
        });
    }

    // Customer Interaction Logging (AI Learning Data)
    async logInteraction(interaction) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO customer_interactions
                (customer_id, customer_name, message, bot_response, intent, sentiment,
                 satisfaction_score, lead_score, urgency_level, products_mentioned,
                 topics_discussed, conversation_stage, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                interaction.customerId,
                interaction.customerName,
                interaction.message,
                interaction.botResponse,
                interaction.intent,
                interaction.sentiment,
                interaction.satisfactionScore,
                interaction.leadScore,
                interaction.urgencyLevel,
                JSON.stringify(interaction.productsMentioned || []),
                JSON.stringify(interaction.topicsDiscussed || []),
                interaction.conversationStage,
                interaction.sessionId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error logging interaction:', err);
                    reject(err);
                } else {
                    console.log('📝 Interaction logged for learning');
                    resolve(this.lastID);
                }
            });
        });
    }

    // Lead Management
    async saveLead(lead) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO leads
                (lead_id, customer_id, customer_name, phone, email, lead_score, urgency_level,
                 status, interested_products, last_message, notes, conversion_probability,
                 estimated_value, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            const values = [
                lead.id,
                lead.customerId,
                lead.customerName,
                lead.phone,
                lead.email,
                lead.leadScore,
                lead.urgencyLevel,
                lead.status,
                JSON.stringify(lead.interestedProducts || []),
                lead.lastMessage,
                lead.notes,
                lead.conversionProbability,
                lead.estimatedValue
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving lead:', err);
                    reject(err);
                } else {
                    console.log('✅ Lead saved');
                    resolve(this.lastID);
                }
            });
        });
    }

    async getAllLeads(filter = {}) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM leads WHERE 1=1';
            const params = [];

            if (filter.urgency) {
                sql += ' AND urgency_level = ?';
                params.push(filter.urgency);
            }

            if (filter.status) {
                sql += ' AND status = ?';
                params.push(filter.status);
            }

            sql += ' ORDER BY lead_score DESC, updated_at DESC';

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const leads = rows.map(row => ({
                        id: row.lead_id,
                        customer: row.customer_name,
                        customerId: row.customer_id,
                        phone: row.phone,
                        email: row.email,
                        score: row.lead_score,
                        urgency: row.urgency_level,
                        status: row.status,
                        interestedProducts: JSON.parse(row.interested_products || '[]'),
                        lastMessage: row.last_message,
                        notes: row.notes,
                        conversionProbability: row.conversion_probability,
                        estimatedValue: row.estimated_value,
                        timestamp: row.created_at
                    }));
                    resolve(leads);
                }
            });
        });
    }

    // AI Learning Pattern Storage
    async saveAIPattern(pattern) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO ai_learning_patterns
                (pattern_type, input_pattern, successful_response, context, success_rate,
                 usage_count, confidence_score, last_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            const values = [
                pattern.type,
                pattern.input,
                pattern.response,
                JSON.stringify(pattern.context || {}),
                pattern.successRate,
                pattern.usageCount,
                pattern.confidenceScore
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Analytics and Insights
    async getAnalytics(timeframe = '30days') {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    COUNT(DISTINCT customer_id) as unique_customers,
                    COUNT(*) as total_interactions,
                    AVG(lead_score) as avg_lead_score,
                    AVG(satisfaction_score) as avg_satisfaction,
                    COUNT(CASE WHEN lead_score >= 20 THEN 1 END) as high_quality_leads,
                    COUNT(CASE WHEN urgency_level = 'high' THEN 1 END) as urgent_leads
                FROM customer_interactions
                WHERE timestamp >= datetime('now', '-30 days')
            `;

            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        uniqueCustomers: row.unique_customers || 0,
                        totalInteractions: row.total_interactions || 0,
                        avgLeadScore: row.avg_lead_score || 0,
                        avgSatisfaction: row.avg_satisfaction || 0,
                        highQualityLeads: row.high_quality_leads || 0,
                        urgentLeads: row.urgent_leads || 0
                    });
                }
            });
        });
    }

    // Product Performance Analytics
    async getProductInsights() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    p.name,
                    p.category,
                    p.price,
                    p.view_count,
                    p.inquiry_count,
                    p.conversion_rate,
                    COUNT(ci.id) as mention_count
                FROM products p
                LEFT JOIN customer_interactions ci ON ci.products_mentioned LIKE '%' || p.product_id || '%'
                GROUP BY p.product_id
                ORDER BY mention_count DESC, p.conversion_rate DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => ({
                        name: row.name,
                        category: row.category,
                        price: row.price,
                        performance: {
                            views: row.view_count,
                            inquiries: row.inquiry_count,
                            mentions: row.mention_count,
                            conversionRate: row.conversion_rate
                        }
                    })));
                }
            });
        });
    }

    // Conversation Intelligence
    async generateConversationInsights() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    intent,
                    COUNT(*) as frequency,
                    AVG(satisfaction_score) as avg_satisfaction,
                    AVG(lead_score) as avg_lead_score,
                    GROUP_CONCAT(DISTINCT topics_discussed) as common_topics
                FROM customer_interactions
                WHERE timestamp >= datetime('now', '-7 days')
                GROUP BY intent
                ORDER BY frequency DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const insights = rows.map(row => ({
                        intent: row.intent,
                        frequency: row.frequency,
                        avgSatisfaction: row.avg_satisfaction,
                        avgLeadScore: row.avg_lead_score,
                        commonTopics: row.common_topics ? row.common_topics.split(',') : []
                    }));
                    resolve(insights);
                }
            });
        });
    }

    // === CONVERSION TRACKING METHODS ===

    // Save customer journey
    async saveCustomerJourney(journey) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO customer_journeys
                (customer_id, start_date, current_stage, status, last_interaction,
                 total_interactions, average_lead_score, peak_lead_score, engagement_score,
                 time_to_conversion, conversion_value, funnel_data, products_data, tags_data, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            const values = [
                journey.customerId,
                journey.startDate.toISOString(),
                journey.currentStage,
                journey.status,
                journey.lastInteraction.toISOString(),
                journey.metrics.totalInteractions,
                journey.metrics.averageLeadScore,
                journey.metrics.peakLeadScore,
                journey.metrics.engagementScore,
                journey.metrics.timeToConversion,
                journey.metrics.conversionValue,
                JSON.stringify(journey.funnel),
                JSON.stringify({
                    viewed: Array.from(journey.products.viewed),
                    inquired: Array.from(journey.products.inquired),
                    ordered: Array.from(journey.products.ordered)
                }),
                JSON.stringify(Array.from(journey.tags))
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving customer journey:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Get all customer journeys
    async getAllCustomerJourneys() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM customer_journeys ORDER BY updated_at DESC`;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching customer journeys:', err);
                    reject(err);
                } else {
                    const journeys = rows.map(row => this.parseCustomerJourney(row));
                    resolve(journeys);
                }
            });
        });
    }

    // Get customer journey by ID
    async getCustomerJourney(customerId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM customer_journeys WHERE customer_id = ?`;

            this.db.get(sql, [customerId], (err, row) => {
                if (err) {
                    console.error('❌ Error fetching customer journey:', err);
                    reject(err);
                } else {
                    const journey = row ? this.parseCustomerJourney(row) : null;
                    resolve(journey);
                }
            });
        });
    }

    // Parse customer journey from database row
    parseCustomerJourney(row) {
        try {
            const funnelData = JSON.parse(row.funnel_data || '{}');
            const productsData = JSON.parse(row.products_data || '{"viewed":[],"inquired":[],"ordered":[]}');
            const tagsData = JSON.parse(row.tags_data || '[]');

            return {
                customerId: row.customer_id,
                startDate: new Date(row.start_date),
                currentStage: row.current_stage,
                status: row.status,
                lastInteraction: new Date(row.last_interaction),
                interactions: [], // Load separately if needed
                touchpoints: [],
                leadScoreHistory: [],
                conversionEvents: [],
                metrics: {
                    totalInteractions: row.total_interactions,
                    averageLeadScore: row.average_lead_score,
                    peakLeadScore: row.peak_lead_score,
                    engagementScore: row.engagement_score,
                    timeToConversion: row.time_to_conversion,
                    conversionValue: row.conversion_value
                },
                funnel: funnelData,
                products: {
                    viewed: new Set(productsData.viewed),
                    inquired: new Set(productsData.inquired),
                    ordered: new Set(productsData.ordered)
                },
                tags: new Set(tagsData)
            };
        } catch (error) {
            console.error('Error parsing customer journey:', error);
            return null;
        }
    }

    // Save journey interaction
    async saveJourneyInteraction(journeyId, interaction) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO journey_interactions
                (journey_id, customer_id, timestamp, message, response, lead_score, intent, order_status, products)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                journeyId,
                interaction.customerId,
                interaction.timestamp.toISOString(),
                interaction.message,
                interaction.response,
                interaction.leadScore,
                interaction.intent,
                interaction.orderStatus,
                JSON.stringify(interaction.products || [])
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving journey interaction:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save conversion event
    async saveConversionEvent(event) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO conversion_events
                (customer_id, event_type, timestamp, event_data, journey_stage)
                VALUES (?, ?, ?, ?, ?)`;

            const values = [
                event.customerId,
                event.type,
                event.timestamp.toISOString(),
                JSON.stringify(event.data || {}),
                event.journeyStage || null
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving conversion event:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save lead score history
    async saveLeadScoreHistory(customerId, score, timestamp, change, triggerEvent) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO lead_score_history
                (customer_id, score, timestamp, score_change, trigger_event)
                VALUES (?, ?, ?, ?, ?)`;

            const values = [
                customerId,
                score,
                timestamp.toISOString(),
                change,
                triggerEvent
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving lead score history:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save analytics report
    async saveAnalyticsReport(report) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO analytics_reports
                (report_type, timeframe, start_date, end_date, report_data)
                VALUES (?, ?, ?, ?, ?)`;

            const values = [
                'conversion_analytics',
                report.timeframe,
                report.startDate.toISOString(),
                report.endDate.toISOString(),
                JSON.stringify(report)
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Error saving analytics report:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save analytics data buffer
    async saveAnalyticsData(analyticsBuffer) {
        return new Promise((resolve, reject) => {
            if (analyticsBuffer.length === 0) {
                resolve(0);
                return;
            }

            const sql = `INSERT INTO analytics_data
                (customer_id, event_type, event_data, date_recorded)
                VALUES (?, ?, ?, ?)`;

            let completed = 0;
            let errors = 0;

            analyticsBuffer.forEach(data => {
                const values = [
                    data.customerId,
                    'interaction',
                    JSON.stringify(data),
                    data.timestamp.toISOString().split('T')[0]
                ];

                this.db.run(sql, values, function(err) {
                    completed++;
                    if (err) {
                        errors++;
                        console.error('❌ Error saving analytics data item:', err);
                    }

                    if (completed === analyticsBuffer.length) {
                        if (errors === 0) {
                            resolve(analyticsBuffer.length);
                        } else {
                            reject(new Error(`${errors} errors while saving analytics data`));
                        }
                    }
                });
            });
        });
    }

    // Get conversion events for customer
    async getConversionEvents(customerId, eventType = null) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM conversion_events WHERE customer_id = ?`;
            let params = [customerId];

            if (eventType) {
                sql += ` AND event_type = ?`;
                params.push(eventType);
            }

            sql += ` ORDER BY timestamp DESC`;

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching conversion events:', err);
                    reject(err);
                } else {
                    const events = rows.map(row => ({
                        id: row.id,
                        customerId: row.customer_id,
                        type: row.event_type,
                        timestamp: new Date(row.timestamp),
                        data: JSON.parse(row.event_data || '{}'),
                        journeyStage: row.journey_stage
                    }));
                    resolve(events);
                }
            });
        });
    }

    // Get analytics reports
    async getAnalyticsReports(reportType = null, limit = 10) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM analytics_reports`;
            let params = [];

            if (reportType) {
                sql += ` WHERE report_type = ?`;
                params.push(reportType);
            }

            sql += ` ORDER BY created_at DESC LIMIT ?`;
            params.push(limit);

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching analytics reports:', err);
                    reject(err);
                } else {
                    const reports = rows.map(row => ({
                        id: row.id,
                        reportType: row.report_type,
                        timeframe: row.timeframe,
                        startDate: new Date(row.start_date),
                        endDate: new Date(row.end_date),
                        data: JSON.parse(row.report_data),
                        createdAt: new Date(row.created_at)
                    }));
                    resolve(reports);
                }
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err);
                } else {
                    console.log('✅ Database connection closed');
                }
            });
        }
    }
}

module.exports = DatabaseManager;