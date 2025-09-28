// Conversion Tracking and Analytics Engine
// Tracks customer journey from lead to purchase with detailed analytics

class ConversionTracker {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.conversions = new Map();
        this.funnelStages = ['awareness', 'interest', 'consideration', 'intent', 'purchase'];
        this.conversionEvents = new Map();
        this.analyticsBuffer = [];

        console.log('📈 Conversion Tracker initialized');
        this.initializeTracker();
    }

    async initializeTracker() {
        try {
            // Load existing conversion data
            await this.loadConversionHistory();

            // Start analytics processing
            this.startAnalyticsProcessing();

            console.log('✅ Conversion tracking ready');
        } catch (error) {
            console.error('❌ Error initializing conversion tracker:', error);
        }
    }

    // Track customer interaction and update conversion funnel
    async trackInteraction(customerId, interactionData) {
        try {
            const {
                message,
                response,
                leadScore,
                intent,
                mentionedProducts,
                orderStatus,
                customerTags,
                timestamp = new Date()
            } = interactionData;

            // Get or create customer journey
            let journey = this.conversions.get(customerId);
            if (!journey) {
                journey = this.createNewJourney(customerId);
                this.conversions.set(customerId, journey);
            }

            // Update journey with new interaction
            await this.updateCustomerJourney(journey, {
                message,
                response,
                leadScore,
                intent,
                mentionedProducts,
                orderStatus,
                customerTags,
                timestamp
            });

            // Track conversion events
            await this.trackConversionEvents(journey, interactionData);

            // Update funnel progression
            this.updateFunnelProgression(journey, leadScore, intent, orderStatus);

            // Store analytics data
            this.bufferAnalyticsData(customerId, journey, interactionData);

            return journey;

        } catch (error) {
            console.error('❌ Error tracking interaction:', error);
            return null;
        }
    }

    // Create new customer journey
    createNewJourney(customerId) {
        return {
            customerId,
            startDate: new Date(),
            currentStage: 'awareness',
            interactions: [],
            touchpoints: [],
            leadScoreHistory: [],
            conversionEvents: [],
            metrics: {
                totalInteractions: 0,
                averageLeadScore: 0,
                peakLeadScore: 0,
                timeToConversion: null,
                conversionValue: 0,
                engagementScore: 0
            },
            funnel: {
                awareness: { reached: true, timestamp: new Date(), interactions: 0 },
                interest: { reached: false, timestamp: null, interactions: 0 },
                consideration: { reached: false, timestamp: null, interactions: 0 },
                intent: { reached: false, timestamp: null, interactions: 0 },
                purchase: { reached: false, timestamp: null, interactions: 0 }
            },
            products: {
                viewed: new Set(),
                inquired: new Set(),
                ordered: new Set()
            },
            tags: new Set(),
            status: 'active',
            lastInteraction: new Date()
        };
    }

    // Update customer journey with new interaction
    async updateCustomerJourney(journey, interactionData) {
        const {
            message,
            response,
            leadScore,
            intent,
            mentionedProducts,
            orderStatus,
            customerTags,
            timestamp
        } = interactionData;

        // Add interaction to history
        const interaction = {
            timestamp,
            message,
            response,
            leadScore,
            intent,
            orderStatus,
            products: mentionedProducts?.map(p => p.name) || []
        };

        journey.interactions.push(interaction);
        journey.lastInteraction = timestamp;
        journey.metrics.totalInteractions++;

        // Update lead score history
        journey.leadScoreHistory.push({
            score: leadScore,
            timestamp,
            change: leadScore - (journey.leadScoreHistory[journey.leadScoreHistory.length - 1]?.score || 0)
        });

        // Update metrics
        journey.metrics.averageLeadScore = journey.leadScoreHistory.reduce((sum, entry) => sum + entry.score, 0) / journey.leadScoreHistory.length;
        journey.metrics.peakLeadScore = Math.max(journey.metrics.peakLeadScore, leadScore);

        // Track products
        if (mentionedProducts) {
            mentionedProducts.forEach(product => {
                journey.products.viewed.add(product.name);

                if (intent.includes('inquiry') || intent.includes('question')) {
                    journey.products.inquired.add(product.name);
                }

                if (orderStatus && orderStatus !== 'inquiry') {
                    journey.products.ordered.add(product.name);
                }
            });
        }

        // Update tags
        if (customerTags) {
            customerTags.forEach(tag => journey.tags.add(tag.tag));
        }

        // Calculate engagement score
        journey.metrics.engagementScore = this.calculateEngagementScore(journey);

        // Save to database
        await this.saveJourneyToDatabase(journey);
    }

    // Track specific conversion events
    async trackConversionEvents(journey, interactionData) {
        const { intent, orderStatus, leadScore, mentionedProducts } = interactionData;

        const events = [];

        // Product interest event
        if (mentionedProducts && mentionedProducts.length > 0) {
            events.push({
                type: 'product_interest',
                timestamp: new Date(),
                data: { products: mentionedProducts.map(p => p.name) }
            });
        }

        // High engagement event
        if (leadScore >= 70) {
            events.push({
                type: 'high_engagement',
                timestamp: new Date(),
                data: { leadScore }
            });
        }

        // Purchase intent event
        if (intent.includes('buy') || intent.includes('purchase') || intent.includes('order')) {
            events.push({
                type: 'purchase_intent',
                timestamp: new Date(),
                data: { intent }
            });
        }

        // Order events
        if (orderStatus) {
            events.push({
                type: `order_${orderStatus}`,
                timestamp: new Date(),
                data: { orderStatus, products: mentionedProducts?.map(p => p.name) || [] }
            });

            // Conversion event
            if (orderStatus === 'completed') {
                events.push({
                    type: 'conversion',
                    timestamp: new Date(),
                    data: {
                        timeToConversion: new Date() - journey.startDate,
                        totalInteractions: journey.metrics.totalInteractions,
                        products: mentionedProducts?.map(p => p.name) || []
                    }
                });

                journey.status = 'converted';
                journey.metrics.timeToConversion = new Date() - journey.startDate;
            }
        }

        // Add events to journey
        journey.conversionEvents.push(...events);

        // Store events globally for analytics
        events.forEach(event => {
            const eventKey = `${event.type}_${Date.now()}_${Math.random()}`;
            this.conversionEvents.set(eventKey, {
                customerId: journey.customerId,
                ...event
            });
        });
    }

    // Update funnel progression
    updateFunnelProgression(journey, leadScore, intent, orderStatus) {
        const currentStage = this.determineFunnelStage(leadScore, intent, orderStatus);

        // Progress through funnel stages
        const stageIndex = this.funnelStages.indexOf(currentStage);

        for (let i = 0; i <= stageIndex; i++) {
            const stage = this.funnelStages[i];
            if (!journey.funnel[stage].reached) {
                journey.funnel[stage].reached = true;
                journey.funnel[stage].timestamp = new Date();
            }
            journey.funnel[stage].interactions++;
        }

        journey.currentStage = currentStage;
    }

    // Determine funnel stage based on behavior
    determineFunnelStage(leadScore, intent, orderStatus) {
        if (orderStatus === 'completed') {
            return 'purchase';
        } else if (orderStatus && orderStatus !== 'inquiry') {
            return 'intent';
        } else if (leadScore >= 60 || intent.includes('buy') || intent.includes('price')) {
            return 'consideration';
        } else if (leadScore >= 30 || intent.includes('product') || intent.includes('info')) {
            return 'interest';
        } else {
            return 'awareness';
        }
    }

    // Calculate engagement score
    calculateEngagementScore(journey) {
        let score = 0;

        // Base score from interactions
        score += Math.min(journey.metrics.totalInteractions * 5, 30);

        // Lead score contribution
        score += journey.metrics.averageLeadScore * 0.3;

        // Product engagement
        score += journey.products.viewed.size * 3;
        score += journey.products.inquired.size * 7;
        score += journey.products.ordered.size * 15;

        // Funnel progression
        const stagesReached = Object.values(journey.funnel).filter(stage => stage.reached).length;
        score += stagesReached * 8;

        // Recency bonus
        const daysSinceLastInteraction = (new Date() - journey.lastInteraction) / (1000 * 60 * 60 * 24);
        if (daysSinceLastInteraction <= 1) {
            score += 10;
        } else if (daysSinceLastInteraction <= 7) {
            score += 5;
        }

        return Math.min(Math.round(score), 100);
    }

    // Buffer analytics data for processing
    bufferAnalyticsData(customerId, journey, interactionData) {
        this.analyticsBuffer.push({
            customerId,
            timestamp: new Date(),
            stage: journey.currentStage,
            leadScore: interactionData.leadScore,
            intent: interactionData.intent,
            orderStatus: interactionData.orderStatus,
            engagementScore: journey.metrics.engagementScore,
            products: interactionData.mentionedProducts?.map(p => p.name) || []
        });
    }

    // Generate comprehensive analytics report
    async generateAnalyticsReport(timeframe = '30d') {
        try {
            const endDate = new Date();
            const startDate = new Date();

            // Set timeframe
            switch (timeframe) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }

            // Get filtered journeys
            const journeys = Array.from(this.conversions.values())
                .filter(journey => journey.startDate >= startDate);

            // Calculate funnel metrics
            const funnelMetrics = this.calculateFunnelMetrics(journeys);

            // Calculate conversion metrics
            const conversionMetrics = this.calculateConversionMetrics(journeys);

            // Product performance
            const productMetrics = this.calculateProductMetrics(journeys);

            // Customer segmentation
            const segmentMetrics = this.calculateSegmentMetrics(journeys);

            // Time-based trends
            const trendMetrics = this.calculateTrendMetrics(journeys, startDate, endDate);

            const report = {
                timeframe,
                startDate,
                endDate,
                summary: {
                    totalCustomers: journeys.length,
                    totalConversions: journeys.filter(j => j.status === 'converted').length,
                    conversionRate: journeys.length > 0 ? (journeys.filter(j => j.status === 'converted').length / journeys.length * 100).toFixed(2) : 0,
                    averageTimeToConversion: this.calculateAverageTimeToConversion(journeys),
                    totalRevenue: this.calculateTotalRevenue(journeys),
                    averageEngagementScore: journeys.length > 0 ? (journeys.reduce((sum, j) => sum + j.metrics.engagementScore, 0) / journeys.length).toFixed(1) : 0
                },
                funnel: funnelMetrics,
                conversions: conversionMetrics,
                products: productMetrics,
                segments: segmentMetrics,
                trends: trendMetrics,
                recommendations: this.generateRecommendations(journeys, funnelMetrics, conversionMetrics)
            };

            // Save report to database
            await this.saveAnalyticsReport(report);

            return report;

        } catch (error) {
            console.error('❌ Error generating analytics report:', error);
            return null;
        }
    }

    // Calculate funnel metrics
    calculateFunnelMetrics(journeys) {
        const funnel = {
            awareness: { count: 0, dropoff: 0 },
            interest: { count: 0, dropoff: 0 },
            consideration: { count: 0, dropoff: 0 },
            intent: { count: 0, dropoff: 0 },
            purchase: { count: 0, dropoff: 0 }
        };

        journeys.forEach(journey => {
            this.funnelStages.forEach(stage => {
                if (journey.funnel[stage].reached) {
                    funnel[stage].count++;
                }
            });
        });

        // Calculate dropoff rates
        for (let i = 0; i < this.funnelStages.length - 1; i++) {
            const currentStage = this.funnelStages[i];
            const nextStage = this.funnelStages[i + 1];

            if (funnel[currentStage].count > 0) {
                funnel[currentStage].dropoff = ((funnel[currentStage].count - funnel[nextStage].count) / funnel[currentStage].count * 100).toFixed(2);
            }
        }

        return funnel;
    }

    // Calculate conversion metrics
    calculateConversionMetrics(journeys) {
        const converted = journeys.filter(j => j.status === 'converted');

        return {
            total: converted.length,
            rate: journeys.length > 0 ? (converted.length / journeys.length * 100).toFixed(2) : 0,
            averageTimeToConversion: this.calculateAverageTimeToConversion(converted),
            averageInteractionsToConversion: converted.length > 0 ? (converted.reduce((sum, j) => sum + j.metrics.totalInteractions, 0) / converted.length).toFixed(1) : 0,
            valueDistribution: this.calculateValueDistribution(converted),
            topConversionSources: this.getTopConversionSources(converted)
        };
    }

    // Calculate product metrics
    calculateProductMetrics(journeys) {
        const productStats = {};

        journeys.forEach(journey => {
            // Track product interactions
            journey.products.viewed.forEach(product => {
                if (!productStats[product]) {
                    productStats[product] = { views: 0, inquiries: 0, orders: 0, conversions: 0 };
                }
                productStats[product].views++;
            });

            journey.products.inquired.forEach(product => {
                if (productStats[product]) {
                    productStats[product].inquiries++;
                }
            });

            journey.products.ordered.forEach(product => {
                if (productStats[product]) {
                    productStats[product].orders++;
                    if (journey.status === 'converted') {
                        productStats[product].conversions++;
                    }
                }
            });
        });

        // Calculate conversion rates and sort
        const productMetrics = Object.entries(productStats).map(([product, stats]) => ({
            product,
            ...stats,
            conversionRate: stats.views > 0 ? (stats.conversions / stats.views * 100).toFixed(2) : 0,
            inquiryRate: stats.views > 0 ? (stats.inquiries / stats.views * 100).toFixed(2) : 0
        })).sort((a, b) => b.conversions - a.conversions);

        return productMetrics;
    }

    // Calculate customer segmentation
    calculateSegmentMetrics(journeys) {
        const segments = {
            highValue: journeys.filter(j => j.metrics.engagementScore >= 80).length,
            mediumValue: journeys.filter(j => j.metrics.engagementScore >= 50 && j.metrics.engagementScore < 80).length,
            lowValue: journeys.filter(j => j.metrics.engagementScore < 50).length,
            fastConverters: journeys.filter(j => j.status === 'converted' && j.metrics.timeToConversion <= 24 * 60 * 60 * 1000).length,
            slowConverters: journeys.filter(j => j.status === 'converted' && j.metrics.timeToConversion > 24 * 60 * 60 * 1000).length,
            multiProduct: journeys.filter(j => j.products.viewed.size > 1).length,
            singleProduct: journeys.filter(j => j.products.viewed.size === 1).length
        };

        return segments;
    }

    // Calculate trend metrics
    calculateTrendMetrics(journeys, startDate, endDate) {
        const dailyMetrics = {};
        const currentDate = new Date(startDate);

        // Initialize daily buckets
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyMetrics[dateKey] = {
                newCustomers: 0,
                conversions: 0,
                totalInteractions: 0,
                averageLeadScore: 0,
                leadScores: []
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate daily metrics
        journeys.forEach(journey => {
            const startDateKey = journey.startDate.toISOString().split('T')[0];
            if (dailyMetrics[startDateKey]) {
                dailyMetrics[startDateKey].newCustomers++;
            }

            if (journey.status === 'converted' && journey.funnel.purchase.timestamp) {
                const conversionDateKey = journey.funnel.purchase.timestamp.toISOString().split('T')[0];
                if (dailyMetrics[conversionDateKey]) {
                    dailyMetrics[conversionDateKey].conversions++;
                }
            }

            // Add interaction metrics
            journey.interactions.forEach(interaction => {
                const interactionDateKey = interaction.timestamp.toISOString().split('T')[0];
                if (dailyMetrics[interactionDateKey]) {
                    dailyMetrics[interactionDateKey].totalInteractions++;
                    dailyMetrics[interactionDateKey].leadScores.push(interaction.leadScore);
                }
            });
        });

        // Calculate average lead scores
        Object.keys(dailyMetrics).forEach(date => {
            const scores = dailyMetrics[date].leadScores;
            dailyMetrics[date].averageLeadScore = scores.length > 0 ?
                (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : 0;
            delete dailyMetrics[date].leadScores; // Clean up
        });

        return dailyMetrics;
    }

    // Generate actionable recommendations
    generateRecommendations(journeys, funnelMetrics, conversionMetrics) {
        const recommendations = [];

        // Funnel optimization
        const highestDropoff = Object.entries(funnelMetrics)
            .filter(([stage, metrics]) => stage !== 'purchase')
            .sort((a, b) => parseFloat(b[1].dropoff) - parseFloat(a[1].dropoff))[0];

        if (highestDropoff && parseFloat(highestDropoff[1].dropoff) > 50) {
            recommendations.push({
                type: 'funnel_optimization',
                priority: 'high',
                stage: highestDropoff[0],
                issue: `High dropoff rate of ${highestDropoff[1].dropoff}% at ${highestDropoff[0]} stage`,
                suggestion: `Focus on improving messaging and engagement strategies for customers in the ${highestDropoff[0]} stage`
            });
        }

        // Conversion rate optimization
        if (parseFloat(conversionMetrics.rate) < 5) {
            recommendations.push({
                type: 'conversion_optimization',
                priority: 'high',
                issue: `Low conversion rate of ${conversionMetrics.rate}%`,
                suggestion: 'Implement more aggressive follow-up strategies and personalized offers for high-scoring leads'
            });
        }

        // Product performance
        const lowPerformingProducts = this.calculateProductMetrics(journeys)
            .filter(product => parseFloat(product.conversionRate) < 2 && product.views > 5);

        if (lowPerformingProducts.length > 0) {
            recommendations.push({
                type: 'product_optimization',
                priority: 'medium',
                issue: `${lowPerformingProducts.length} products have low conversion rates`,
                suggestion: 'Review pricing, descriptions, and marketing strategies for underperforming products'
            });
        }

        // Engagement optimization
        const lowEngagementCustomers = journeys.filter(j => j.metrics.engagementScore < 30).length;
        if (lowEngagementCustomers > journeys.length * 0.3) {
            recommendations.push({
                type: 'engagement_optimization',
                priority: 'medium',
                issue: `${lowEngagementCustomers} customers have low engagement scores`,
                suggestion: 'Implement more interactive content and personalized messaging to increase engagement'
            });
        }

        return recommendations;
    }

    // Helper methods
    calculateAverageTimeToConversion(journeys) {
        const converted = journeys.filter(j => j.status === 'converted' && j.metrics.timeToConversion);
        if (converted.length === 0) return 0;

        const averageMs = converted.reduce((sum, j) => sum + j.metrics.timeToConversion, 0) / converted.length;
        return Math.round(averageMs / (1000 * 60 * 60)); // Convert to hours
    }

    calculateTotalRevenue(journeys) {
        return journeys
            .filter(j => j.status === 'converted')
            .reduce((sum, j) => sum + j.metrics.conversionValue, 0);
    }

    calculateValueDistribution(converted) {
        const values = converted.map(j => j.metrics.conversionValue).sort((a, b) => a - b);
        return {
            min: values[0] || 0,
            max: values[values.length - 1] || 0,
            median: values[Math.floor(values.length / 2)] || 0,
            average: values.length > 0 ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2) : 0
        };
    }

    getTopConversionSources(converted) {
        // Simplified - in real implementation, track actual sources
        return [
            { source: 'Facebook Messenger', conversions: converted.length, rate: '100%' }
        ];
    }

    // Database operations
    async loadConversionHistory() {
        try {
            const journeys = await this.db.getAllCustomerJourneys();
            journeys.forEach(journey => {
                this.conversions.set(journey.customerId, journey);
            });
            console.log(`📊 Loaded ${journeys.length} customer journeys`);
        } catch (error) {
            console.error('Error loading conversion history:', error);
        }
    }

    async saveJourneyToDatabase(journey) {
        try {
            await this.db.saveCustomerJourney(journey);
        } catch (error) {
            console.error('Error saving journey to database:', error);
        }
    }

    async saveAnalyticsReport(report) {
        try {
            await this.db.saveAnalyticsReport(report);
            console.log('📈 Analytics report saved to database');
        } catch (error) {
            console.error('Error saving analytics report:', error);
        }
    }

    // Start analytics processing
    startAnalyticsProcessing() {
        // Process analytics buffer every 5 minutes
        setInterval(() => {
            this.processAnalyticsBuffer();
        }, 5 * 60 * 1000);

        console.log('🔄 Analytics processing started');
    }

    async processAnalyticsBuffer() {
        if (this.analyticsBuffer.length === 0) return;

        try {
            // Process buffered analytics data
            const buffer = [...this.analyticsBuffer];
            this.analyticsBuffer = [];

            // Aggregate and save analytics
            await this.db.saveAnalyticsData(buffer);

            console.log(`📊 Processed ${buffer.length} analytics events`);
        } catch (error) {
            console.error('Error processing analytics buffer:', error);
        }
    }

    // Get real-time conversion metrics
    getRealTimeMetrics() {
        const totalJourneys = this.conversions.size;
        const converted = Array.from(this.conversions.values()).filter(j => j.status === 'converted').length;
        const active = Array.from(this.conversions.values()).filter(j => j.status === 'active').length;

        return {
            totalCustomers: totalJourneys,
            activeCustomers: active,
            totalConversions: converted,
            conversionRate: totalJourneys > 0 ? (converted / totalJourneys * 100).toFixed(2) : 0,
            averageEngagement: totalJourneys > 0 ?
                (Array.from(this.conversions.values()).reduce((sum, j) => sum + j.metrics.engagementScore, 0) / totalJourneys).toFixed(1) : 0
        };
    }
}

module.exports = ConversionTracker;