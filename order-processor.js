// Order Processing Engine for FB Messenger Agent
// Handles order capture, processing, and tracking

class OrderProcessor {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.orderStates = {
            INQUIRY: 'inquiry',
            COLLECTING_INFO: 'collecting_info',
            CONFIRMING: 'confirming',
            PROCESSING: 'processing',
            COMPLETED: 'completed',
            CANCELLED: 'cancelled'
        };

        console.log('📦 Order Processor initialized');
    }

    // Detect if customer is ready to place an order
    detectOrderIntent(analysis, mentionedProducts) {
        const orderIntents = [
            'purchase_intent', 'price_inquiry', 'availability_check'
        ];

        const strongOrderSignals = [
            'buy now', 'order now', 'purchase', 'checkout', 'take my order',
            'i want to buy', 'ready to order', 'proceed', 'confirm'
        ];

        const hasOrderIntent = orderIntents.includes(analysis.intent);
        const hasStrongSignals = analysis.buyingSignals?.some(signal =>
            strongOrderSignals.includes(signal.keyword)
        );
        const hasProductMention = mentionedProducts && mentionedProducts.length > 0;

        return {
            isOrderReady: hasOrderIntent && (hasStrongSignals || hasProductMention),
            confidence: this.calculateOrderIntentConfidence(analysis, mentionedProducts),
            suggestedAction: this.suggestOrderAction(analysis, mentionedProducts)
        };
    }

    calculateOrderIntentConfidence(analysis, mentionedProducts) {
        let confidence = 0;

        // Base confidence from lead score
        confidence += (analysis.leadScore || 0) * 0.01; // Convert 0-100 to 0-1

        // Product mentions boost confidence
        if (mentionedProducts && mentionedProducts.length > 0) {
            confidence += 0.3;
        }

        // Contact info sharing = very high confidence
        if (analysis.contactInfo && Object.keys(analysis.contactInfo).length > 0) {
            confidence += 0.4;
        }

        // Order details mentioned = ready to order
        if (analysis.orderDetails && Object.keys(analysis.orderDetails).length > 0) {
            confidence += 0.5;
        }

        return Math.min(confidence, 1.0);
    }

    suggestOrderAction(analysis, mentionedProducts) {
        const confidence = this.calculateOrderIntentConfidence(analysis, mentionedProducts);

        if (confidence >= 0.8) {
            return 'process_order';
        } else if (confidence >= 0.6) {
            return 'collect_details';
        } else if (confidence >= 0.4) {
            return 'qualify_interest';
        } else {
            return 'nurture_lead';
        }
    }

    // Process order based on intent and collected information
    async processOrderFlow(customerId, message, analysis, mentionedProducts, businessConfig) {
        try {
            const orderIntent = this.detectOrderIntent(analysis, mentionedProducts);

            // Get or create order session
            let orderSession = await this.getOrderSession(customerId);

            if (!orderSession && orderIntent.isOrderReady) {
                orderSession = await this.createOrderSession(customerId, mentionedProducts);
            }

            if (orderSession) {
                return await this.handleOrderSession(orderSession, message, analysis, businessConfig);
            } else {
                return this.generateOrderNurtureResponse(mentionedProducts, businessConfig);
            }

        } catch (error) {
            console.error('❌ Order processing error:', error);
            return {
                response: "I'd love to help you with your order! Let me connect you with our team to ensure everything goes smoothly.",
                orderStatus: 'error',
                nextAction: 'human_handoff'
            };
        }
    }

    // Create new order session
    async createOrderSession(customerId, mentionedProducts) {
        const orderSession = {
            id: `order_${customerId}_${Date.now()}`,
            customerId: customerId,
            state: this.orderStates.INQUIRY,
            products: mentionedProducts?.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                quantity: 1
            })) || [],
            customerInfo: {},
            orderDetails: {},
            totalAmount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to database
        await this.saveOrderSession(orderSession);
        console.log('📝 Order session created:', orderSession.id);

        return orderSession;
    }

    // Get existing order session
    async getOrderSession(customerId) {
        try {
            // Check for active order sessions
            const sql = `
                SELECT * FROM order_sessions
                WHERE customer_id = ? AND state NOT IN ('completed', 'cancelled')
                ORDER BY updated_at DESC LIMIT 1
            `;

            return new Promise((resolve, reject) => {
                this.db.db.get(sql, [customerId], (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        resolve({
                            ...row,
                            products: JSON.parse(row.products || '[]'),
                            customerInfo: JSON.parse(row.customer_info || '{}'),
                            orderDetails: JSON.parse(row.order_details || '{}')
                        });
                    } else {
                        resolve(null);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error getting order session:', error);
            return null;
        }
    }

    // Save order session to database
    async saveOrderSession(orderSession) {
        try {
            const sql = `
                INSERT OR REPLACE INTO order_sessions
                (session_id, customer_id, state, products, customer_info, order_details,
                 total_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                orderSession.id,
                orderSession.customerId,
                orderSession.state,
                JSON.stringify(orderSession.products),
                JSON.stringify(orderSession.customerInfo),
                JSON.stringify(orderSession.orderDetails),
                orderSession.totalAmount,
                orderSession.createdAt.toISOString(),
                orderSession.updatedAt.toISOString()
            ];

            return new Promise((resolve, reject) => {
                this.db.db.run(sql, values, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error saving order session:', error);
        }
    }

    // Handle different order session states
    async handleOrderSession(orderSession, message, analysis, businessConfig) {
        switch (orderSession.state) {
            case this.orderStates.INQUIRY:
                return this.handleInquiryState(orderSession, message, analysis, businessConfig);

            case this.orderStates.COLLECTING_INFO:
                return this.handleCollectingInfoState(orderSession, message, analysis, businessConfig);

            case this.orderStates.CONFIRMING:
                return this.handleConfirmingState(orderSession, message, analysis, businessConfig);

            default:
                return this.handleInquiryState(orderSession, message, analysis, businessConfig);
        }
    }

    // Handle inquiry state - customer interested in product
    async handleInquiryState(orderSession, message, analysis, businessConfig) {
        // Update customer info if provided
        if (analysis.contactInfo && Object.keys(analysis.contactInfo).length > 0) {
            orderSession.customerInfo = { ...orderSession.customerInfo, ...analysis.contactInfo };
        }

        // Update order details if provided
        if (analysis.orderDetails && Object.keys(analysis.orderDetails).length > 0) {
            orderSession.orderDetails = { ...orderSession.orderDetails, ...analysis.orderDetails };
        }

        // Check if we have enough info to proceed
        const hasProducts = orderSession.products.length > 0;
        const hasContactInfo = orderSession.customerInfo.name || orderSession.customerInfo.phone;

        if (hasProducts && hasContactInfo) {
            // Move to confirmation
            orderSession.state = this.orderStates.CONFIRMING;
            await this.saveOrderSession(orderSession);
            return this.generateOrderConfirmation(orderSession, businessConfig);
        } else if (hasProducts) {
            // Need contact info
            orderSession.state = this.orderStates.COLLECTING_INFO;
            await this.saveOrderSession(orderSession);
            return this.generateContactInfoRequest(orderSession, businessConfig);
        } else {
            // Need product selection
            return this.generateProductSelectionResponse(orderSession, businessConfig);
        }
    }

    // Handle collecting info state - gathering customer details
    async handleCollectingInfoState(orderSession, message, analysis, businessConfig) {
        // Update customer info
        if (analysis.contactInfo && Object.keys(analysis.contactInfo).length > 0) {
            orderSession.customerInfo = { ...orderSession.customerInfo, ...analysis.contactInfo };
        }

        // Update order details
        if (analysis.orderDetails && Object.keys(analysis.orderDetails).length > 0) {
            orderSession.orderDetails = { ...orderSession.orderDetails, ...analysis.orderDetails };
        }

        // Check if we have minimum required info
        const hasName = orderSession.customerInfo.name;
        const hasContact = orderSession.customerInfo.phone || orderSession.customerInfo.email;

        if (hasName && hasContact) {
            // Move to confirmation
            orderSession.state = this.orderStates.CONFIRMING;
            await this.saveOrderSession(orderSession);
            return this.generateOrderConfirmation(orderSession, businessConfig);
        } else {
            // Still need more info
            return this.generateMissingInfoRequest(orderSession, businessConfig);
        }
    }

    // Handle confirming state - final order confirmation
    async handleConfirmingState(orderSession, message, analysis, businessConfig) {
        const messageLower = message.toLowerCase();
        const confirmationKeywords = ['yes', 'confirm', 'proceed', 'ok', 'correct', 'go ahead'];
        const cancellationKeywords = ['no', 'cancel', 'stop', 'not now', 'maybe later'];

        const isConfirming = confirmationKeywords.some(keyword => messageLower.includes(keyword));
        const isCancelling = cancellationKeywords.some(keyword => messageLower.includes(keyword));

        if (isConfirming) {
            // Process the order
            orderSession.state = this.orderStates.PROCESSING;
            await this.saveOrderSession(orderSession);

            // Create final order record
            const order = await this.createFinalOrder(orderSession, businessConfig);

            return this.generateOrderSuccessResponse(order, businessConfig);
        } else if (isCancelling) {
            // Cancel the order
            orderSession.state = this.orderStates.CANCELLED;
            await this.saveOrderSession(orderSession);

            return this.generateOrderCancellationResponse(businessConfig);
        } else {
            // Unclear response, ask for clarification
            return this.generateConfirmationClarification(orderSession, businessConfig);
        }
    }

    // Generate different response types
    generateOrderConfirmation(orderSession, businessConfig) {
        const products = orderSession.products;
        const customerInfo = orderSession.customerInfo;
        const total = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

        let response = `📋 **Order Confirmation**\n\n`;
        response += `**Customer:** ${customerInfo.name || 'Customer'}\n`;
        response += `**Contact:** ${customerInfo.phone || customerInfo.email || 'Provided'}\n\n`;

        response += `**Items:**\n`;
        products.forEach(product => {
            response += `• ${product.name} - ₱${this.formatPrice(product.price)} x ${product.quantity}\n`;
        });

        response += `\n**Total: ₱${this.formatPrice(total)}**\n\n`;

        if (orderSession.orderDetails.address) {
            response += `**Delivery Address:** ${orderSession.orderDetails.address}\n\n`;
        }

        response += `Is this order correct? Reply "Yes" to confirm or let me know what needs to be changed! 😊`;

        return {
            response,
            orderStatus: 'confirming',
            nextAction: 'await_confirmation',
            orderTotal: total
        };
    }

    generateContactInfoRequest(orderSession, businessConfig) {
        const products = orderSession.products;
        const productNames = products.map(p => p.name).join(', ');

        const response = `Great choice with ${productNames}! 🎉\n\nTo process your order, I'll need a few details:\n\n📝 **Your name**\n📞 **Phone number**\n📍 **Delivery address** (if needed)\n\nYou can share them all at once or one by one - whatever's easier for you! 😊`;

        return {
            response,
            orderStatus: 'collecting_info',
            nextAction: 'collect_contact_info'
        };
    }

    generateMissingInfoRequest(orderSession, businessConfig) {
        const customerInfo = orderSession.customerInfo;
        const missing = [];

        if (!customerInfo.name) missing.push('your name');
        if (!customerInfo.phone && !customerInfo.email) missing.push('phone number or email');

        const response = `Almost there! I just need ${missing.join(' and ')} to complete your order. 😊`;

        return {
            response,
            orderStatus: 'collecting_info',
            nextAction: 'collect_missing_info',
            missingInfo: missing
        };
    }

    generateOrderSuccessResponse(order, businessConfig) {
        const response = `🎉 **Order Confirmed!**\n\nOrder #${order.orderNumber}\n\nThank you ${order.customerName}! Your order has been received and will be processed shortly.\n\n📞 We'll contact you at ${order.customerPhone} for any updates.\n\n${businessConfig.businessInfo?.businessHours ? `📅 **Business Hours:** ${businessConfig.businessInfo.businessHours}\n` : ''}${businessConfig.businessInfo?.contactInfo?.phone ? `☎️ **Questions?** Call ${businessConfig.businessInfo.contactInfo.phone}` : ''}\n\nWe appreciate your business! 🙏`;

        return {
            response,
            orderStatus: 'completed',
            nextAction: 'order_fulfilled',
            orderId: order.id
        };
    }

    generateOrderCancellationResponse(businessConfig) {
        const response = `No worries at all! 😊 Your order has been cancelled.\n\nFeel free to browse our products anytime or ask if you need help with anything else!\n\nWe're here whenever you're ready! 🛍️`;

        return {
            response,
            orderStatus: 'cancelled',
            nextAction: 'continue_browsing'
        };
    }

    generateOrderNurtureResponse(mentionedProducts, businessConfig) {
        if (mentionedProducts && mentionedProducts.length > 0) {
            const product = mentionedProducts[0];
            const response = `I'd be happy to help you with ${product.name}! 😊\n\n💰 **Price:** ₱${this.formatPrice(product.price)}\n📦 **Stock:** ${product.stock > 0 ? 'Available' : 'Checking availability'}\n\nWould you like to:\n• Learn more about this product\n• Check shipping options\n• Place an order\n• See similar products\n\nJust let me know how I can help! 🛍️`;

            return {
                response,
                orderStatus: 'nurturing',
                nextAction: 'qualify_interest'
            };
        }

        return {
            response: "I'd love to help you find the perfect product! What are you looking for today? 😊",
            orderStatus: 'browsing',
            nextAction: 'product_discovery'
        };
    }

    // Create final order record
    async createFinalOrder(orderSession, businessConfig) {
        const orderNumber = this.generateOrderNumber();
        const total = orderSession.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

        const order = {
            id: `order_${Date.now()}`,
            orderNumber: orderNumber,
            customerId: orderSession.customerId,
            customerName: orderSession.customerInfo.name,
            customerPhone: orderSession.customerInfo.phone,
            customerEmail: orderSession.customerInfo.email,
            products: orderSession.products,
            totalAmount: total,
            status: 'confirmed',
            orderDetails: orderSession.orderDetails,
            createdAt: new Date()
        };

        // Save to database
        await this.saveOrder(order);

        // Log to spreadsheet (if configured)
        await this.logOrderToSpreadsheet(order, businessConfig);

        return order;
    }

    // Save order to database
    async saveOrder(order) {
        try {
            const sql = `
                INSERT INTO orders
                (order_id, order_number, customer_id, customer_name, customer_phone,
                 customer_email, products, total_amount, status, order_details, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                order.id,
                order.orderNumber,
                order.customerId,
                order.customerName,
                order.customerPhone,
                order.customerEmail,
                JSON.stringify(order.products),
                order.totalAmount,
                order.status,
                JSON.stringify(order.orderDetails),
                order.createdAt.toISOString()
            ];

            return new Promise((resolve, reject) => {
                this.db.db.run(sql, values, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('💾 Order saved to database:', order.orderNumber);
                        resolve(this.lastID);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error saving order:', error);
        }
    }

    // Log order to spreadsheet (Google Sheets integration placeholder)
    async logOrderToSpreadsheet(order, businessConfig) {
        try {
            // This would integrate with Google Sheets API
            // For now, we'll just log the order data
            console.log('📊 Order logged for spreadsheet integration:', {
                orderNumber: order.orderNumber,
                customer: order.customerName,
                phone: order.customerPhone,
                products: order.products.map(p => `${p.name} x${p.quantity}`).join(', '),
                total: order.totalAmount,
                date: order.createdAt.toISOString()
            });

            // TODO: Implement actual Google Sheets integration
            // This would append a row to the configured spreadsheet
        } catch (error) {
            console.error('❌ Error logging to spreadsheet:', error);
        }
    }

    // Utility functions
    generateOrderNumber() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `ORD-${timestamp.slice(-6)}-${random}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-PH').format(price);
    }
}

module.exports = OrderProcessor;