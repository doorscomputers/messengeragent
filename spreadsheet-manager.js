const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class SpreadsheetManager {
    constructor() {
        this.sheets = null;
        this.spreadsheetId = null;
        this.isInitialized = false;
    }

    async initialize(credentials, spreadsheetId) {
        try {
            // Initialize Google Sheets API
            const auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            this.spreadsheetId = spreadsheetId;

            // Setup initial sheets if they don't exist
            await this.setupSheets();
            this.isInitialized = true;

            console.log('✅ Spreadsheet Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Spreadsheet Manager:', error.message);
            return false;
        }
    }

    async setupSheets() {
        try {
            // Get existing sheets
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);

            // Create required sheets if they don't exist
            const requiredSheets = [
                { name: 'Orders', headers: ['Timestamp', 'Customer ID', 'Customer Name', 'Contact Info', 'Products', 'Quantity', 'Total Amount', 'Status', 'Priority', 'Lead Score', 'Tags'] },
                { name: 'Leads', headers: ['Timestamp', 'Customer ID', 'Customer Name', 'Contact Info', 'Lead Score', 'Buying Stage', 'Interest Level', 'Priority', 'Tags', 'Last Message', 'Conversion Status'] },
                { name: 'Analytics', headers: ['Date', 'Total Messages', 'New Leads', 'Orders', 'Conversion Rate', 'Avg Lead Score', 'Top Products'] }
            ];

            for (const sheetConfig of requiredSheets) {
                if (!existingSheets.includes(sheetConfig.name)) {
                    await this.createSheet(sheetConfig.name, sheetConfig.headers);
                } else {
                    // Update headers if sheet exists
                    await this.updateHeaders(sheetConfig.name, sheetConfig.headers);
                }
            }
        } catch (error) {
            console.error('Error setting up sheets:', error.message);
        }
    }

    async createSheet(sheetName, headers) {
        try {
            // Add new sheet
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName
                            }
                        }
                    }]
                }
            });

            // Add headers
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });

            console.log(`✅ Created sheet: ${sheetName}`);
        } catch (error) {
            console.error(`Error creating sheet ${sheetName}:`, error.message);
        }
    }

    async updateHeaders(sheetName, headers) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });
        } catch (error) {
            console.error(`Error updating headers for ${sheetName}:`, error.message);
        }
    }

    async logOrder(orderData) {
        if (!this.isInitialized) {
            console.error('Spreadsheet Manager not initialized');
            return false;
        }

        try {
            const timestamp = new Date().toISOString();
            const row = [
                timestamp,
                orderData.customerId || '',
                orderData.customerName || '',
                orderData.contactInfo || '',
                Array.isArray(orderData.products) ? orderData.products.join(', ') : orderData.products || '',
                orderData.quantity || '',
                orderData.totalAmount || '',
                orderData.status || 'pending',
                orderData.priority || 'medium',
                orderData.leadScore || 0,
                Array.isArray(orderData.tags) ? orderData.tags.join(', ') : orderData.tags || ''
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Orders!A:K',
                valueInputOption: 'RAW',
                resource: {
                    values: [row]
                }
            });

            console.log(`📊 Order logged to spreadsheet: ${orderData.customerId}`);
            return true;
        } catch (error) {
            console.error('Error logging order:', error.message);
            return false;
        }
    }

    async logLead(leadData) {
        if (!this.isInitialized) {
            console.error('Spreadsheet Manager not initialized');
            return false;
        }

        try {
            const timestamp = new Date().toISOString();
            const row = [
                timestamp,
                leadData.customerId || '',
                leadData.customerName || '',
                leadData.contactInfo || '',
                leadData.leadScore || 0,
                leadData.buyingStage || 'awareness',
                leadData.interestLevel || 'low',
                leadData.priority || 'medium',
                Array.isArray(leadData.tags) ? leadData.tags.join(', ') : leadData.tags || '',
                leadData.lastMessage || '',
                leadData.conversionStatus || 'lead'
            ];

            // Check if lead already exists and update, otherwise append
            const existingLead = await this.findExistingLead(leadData.customerId);

            if (existingLead) {
                await this.updateExistingLead(existingLead.row, row);
            } else {
                await this.sheets.spreadsheets.values.append({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Leads!A:K',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [row]
                    }
                });
            }

            console.log(`📊 Lead logged to spreadsheet: ${leadData.customerId}`);
            return true;
        } catch (error) {
            console.error('Error logging lead:', error.message);
            return false;
        }
    }

    async findExistingLead(customerId) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Leads!B:B'
            });

            const values = response.data.values || [];
            for (let i = 0; i < values.length; i++) {
                if (values[i][0] === customerId) {
                    return { row: i + 1 }; // +1 because sheets are 1-indexed
                }
            }
            return null;
        } catch (error) {
            console.error('Error finding existing lead:', error.message);
            return null;
        }
    }

    async updateExistingLead(rowNumber, newData) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `Leads!A${rowNumber}:K${rowNumber}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [newData]
                }
            });
        } catch (error) {
            console.error('Error updating existing lead:', error.message);
        }
    }

    async logDailyAnalytics(analyticsData) {
        if (!this.isInitialized) {
            console.error('Spreadsheet Manager not initialized');
            return false;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const row = [
                today,
                analyticsData.totalMessages || 0,
                analyticsData.newLeads || 0,
                analyticsData.orders || 0,
                analyticsData.conversionRate || '0%',
                analyticsData.avgLeadScore || 0,
                Array.isArray(analyticsData.topProducts) ? analyticsData.topProducts.join(', ') : analyticsData.topProducts || ''
            ];

            // Check if today's analytics already exist
            const existingRow = await this.findTodaysAnalytics(today);

            if (existingRow) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `Analytics!A${existingRow}:G${existingRow}`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [row]
                    }
                });
            } else {
                await this.sheets.spreadsheets.values.append({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Analytics!A:G',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [row]
                    }
                });
            }

            console.log(`📊 Daily analytics logged to spreadsheet: ${today}`);
            return true;
        } catch (error) {
            console.error('Error logging analytics:', error.message);
            return false;
        }
    }

    async findTodaysAnalytics(date) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Analytics!A:A'
            });

            const values = response.data.values || [];
            for (let i = 0; i < values.length; i++) {
                if (values[i][0] === date) {
                    return i + 1; // +1 because sheets are 1-indexed
                }
            }
            return null;
        } catch (error) {
            console.error('Error finding today\'s analytics:', error.message);
            return null;
        }
    }

    async generateAnalyticsReport() {
        if (!this.isInitialized) {
            console.error('Spreadsheet Manager not initialized');
            return null;
        }

        try {
            // Get recent data for analysis
            const [ordersResponse, leadsResponse] = await Promise.all([
                this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Orders!A:K'
                }),
                this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Leads!A:K'
                })
            ]);

            const orders = ordersResponse.data.values || [];
            const leads = leadsResponse.data.values || [];

            // Calculate analytics
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = orders.filter(row => row[0] && row[0].startsWith(today));
            const todayLeads = leads.filter(row => row[0] && row[0].startsWith(today));

            const analytics = {
                totalMessages: todayLeads.length,
                newLeads: todayLeads.length,
                orders: todayOrders.length,
                conversionRate: todayLeads.length > 0 ? `${((todayOrders.length / todayLeads.length) * 100).toFixed(1)}%` : '0%',
                avgLeadScore: todayLeads.length > 0 ? Math.round(todayLeads.reduce((sum, lead) => sum + parseFloat(lead[4] || 0), 0) / todayLeads.length) : 0,
                topProducts: this.getTopProducts(todayOrders)
            };

            // Log analytics
            await this.logDailyAnalytics(analytics);

            return analytics;
        } catch (error) {
            console.error('Error generating analytics report:', error.message);
            return null;
        }
    }

    getTopProducts(orders) {
        const productCount = {};

        orders.forEach(order => {
            const products = order[4] || '';
            const productList = products.split(',').map(p => p.trim());

            productList.forEach(product => {
                if (product) {
                    productCount[product] = (productCount[product] || 0) + 1;
                }
            });
        });

        return Object.entries(productCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([product, count]) => `${product} (${count})`);
    }

    async createBackup() {
        if (!this.isInitialized) {
            console.error('Spreadsheet Manager not initialized');
            return false;
        }

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = {
                timestamp,
                spreadsheetId: this.spreadsheetId,
                created: new Date().toISOString()
            };

            // Get all data
            const [ordersData, leadsData, analyticsData] = await Promise.all([
                this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Orders!A:K'
                }),
                this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Leads!A:K'
                }),
                this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Analytics!A:G'
                })
            ]);

            backupData.orders = ordersData.data.values || [];
            backupData.leads = leadsData.data.values || [];
            backupData.analytics = analyticsData.data.values || [];

            // Save backup locally
            const backupPath = path.join(__dirname, 'backups', `spreadsheet-backup-${timestamp}.json`);

            // Create backups directory if it doesn't exist
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

            console.log(`📋 Spreadsheet backup created: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('Error creating backup:', error.message);
            return false;
        }
    }
}

module.exports = SpreadsheetManager;