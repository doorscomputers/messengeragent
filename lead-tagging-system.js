// Lead Tagging System for FB Messenger Agent
// Advanced customer classification and tagging based on behavior and signals

class LeadTaggingSystem {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.tagCategories = {
            BUYING_STAGE: 'buying_stage',
            INTEREST_LEVEL: 'interest_level',
            CUSTOMER_TYPE: 'customer_type',
            BEHAVIOR: 'behavior',
            PRIORITY: 'priority',
            SEGMENT: 'segment'
        };

        console.log('🏷️ Lead Tagging System initialized');
    }

    // Main tagging function - analyzes customer and assigns appropriate tags
    async tagCustomer(customerId, analysis, mentionedProducts, orderStatus, context) {
        try {
            const tags = await this.generateTags(analysis, mentionedProducts, orderStatus, context);
            const customerProfile = await this.buildCustomerProfile(customerId, tags, analysis);

            // Save tags to database
            await this.saveCustomerTags(customerId, tags, customerProfile);

            return {
                tags,
                customerProfile,
                recommendations: this.generateRecommendations(tags, customerProfile)
            };

        } catch (error) {
            console.error('❌ Lead tagging error:', error);
            return { tags: [], customerProfile: {}, recommendations: [] };
        }
    }

    // Generate comprehensive tags based on analysis
    async generateTags(analysis, mentionedProducts, orderStatus, context) {
        const tags = [];

        // 1. Buying Stage Tags
        tags.push(...this.getBuyingStageTagsʻ(analysis, orderStatus));

        // 2. Interest Level Tags
        tags.push(...this.getInterestLevelTags(analysis.leadScore, mentionedProducts));

        // 3. Customer Type Tags
        tags.push(...this.getCustomerTypeTags(analysis, context));

        // 4. Behavior Tags
        tags.push(...this.getBehaviorTags(analysis, context));

        // 5. Priority Tags
        tags.push(...this.getPriorityTags(analysis, orderStatus));

        // 6. Segment Tags
        tags.push(...this.getSegmentTags(analysis, mentionedProducts));

        return this.deduplicateTags(tags);
    }

    // Buying stage classification
    getBuyingStageTagsʻ(analysis, orderStatus) {
        const tags = [];

        // Order-based stages
        if (orderStatus) {
            switch (orderStatus) {
                case 'completed':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'customer', priority: 'high' });
                    break;
                case 'confirming':
                case 'processing':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'ready_to_buy', priority: 'critical' });
                    break;
                case 'collecting_info':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'qualifying', priority: 'high' });
                    break;
                case 'nurturing':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'consideration', priority: 'medium' });
                    break;
                default:
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'awareness', priority: 'low' });
            }
        } else {
            // Intent-based stages
            switch (analysis.intent) {
                case 'purchase_intent':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'ready_to_buy', priority: 'critical' });
                    break;
                case 'price_inquiry':
                case 'availability_check':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'evaluation', priority: 'high' });
                    break;
                case 'comparison':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'consideration', priority: 'medium' });
                    break;
                case 'product_inquiry':
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'interest', priority: 'medium' });
                    break;
                default:
                    tags.push({ category: this.tagCategories.BUYING_STAGE, tag: 'awareness', priority: 'low' });
            }
        }

        return tags;
    }

    // Interest level classification
    getInterestLevelTags(leadScore, mentionedProducts) {
        const tags = [];

        // Score-based interest
        if (leadScore >= 70) {
            tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'very_high', priority: 'critical' });
        } else if (leadScore >= 50) {
            tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'high', priority: 'high' });
        } else if (leadScore >= 30) {
            tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'medium', priority: 'medium' });
        } else if (leadScore >= 15) {
            tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'low', priority: 'low' });
        } else {
            tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'very_low', priority: 'low' });
        }

        // Product-specific interest
        if (mentionedProducts && mentionedProducts.length > 0) {
            if (mentionedProducts.length >= 3) {
                tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'exploring_multiple', priority: 'medium' });
            } else {
                tags.push({ category: this.tagCategories.INTEREST_LEVEL, tag: 'focused_interest', priority: 'high' });
            }
        }

        return tags;
    }

    // Customer type classification
    getCustomerTypeTags(analysis, context) {
        const tags = [];

        // Returning vs new customer
        if (context.previousPurchase) {
            tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'returning_customer', priority: 'high' });
        } else {
            tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'new_prospect', priority: 'medium' });
        }

        // Engagement level
        if (context.interactionCount >= 5) {
            tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'highly_engaged', priority: 'high' });
        } else if (context.interactionCount >= 2) {
            tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'engaged', priority: 'medium' });
        } else {
            tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'first_time_visitor', priority: 'low' });
        }

        // Buying behavior patterns
        if (analysis.buyingSignals) {
            const priceSignals = analysis.buyingSignals.filter(s => s.category === 'price_conscious');
            const readySignals = analysis.buyingSignals.filter(s => s.category === 'purchase_ready');

            if (readySignals.length > 0) {
                tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'impulse_buyer', priority: 'critical' });
            } else if (priceSignals.length > 0) {
                tags.push({ category: this.tagCategories.CUSTOMER_TYPE, tag: 'price_conscious', priority: 'medium' });
            }
        }

        return tags;
    }

    // Behavior pattern tags
    getBehaviorTags(analysis, context) {
        const tags = [];

        // Urgency behavior
        if (analysis.urgencyIndicators && analysis.urgencyIndicators.length > 0) {
            tags.push({ category: this.tagCategories.BEHAVIOR, tag: 'urgent_buyer', priority: 'critical' });
        }

        // Information seeking behavior
        if (analysis.intent === 'product_inquiry' || analysis.intent === 'comparison') {
            tags.push({ category: this.tagCategories.BEHAVIOR, tag: 'researcher', priority: 'medium' });
        }

        // Decision making behavior
        if (analysis.buyingSignals) {
            const decisionSignals = analysis.buyingSignals.filter(s => s.category === 'decision_making');
            if (decisionSignals.length > 0) {
                tags.push({ category: this.tagCategories.BEHAVIOR, tag: 'comparison_shopper', priority: 'medium' });
            }
        }

        // Contact sharing behavior
        if (analysis.contactInfo && Object.keys(analysis.contactInfo).length > 0) {
            tags.push({ category: this.tagCategories.BEHAVIOR, tag: 'information_sharer', priority: 'high' });
        }

        // Sentiment-based behavior
        if (analysis.sentiment === 'positive') {
            tags.push({ category: this.tagCategories.BEHAVIOR, tag: 'positive_engagement', priority: 'medium' });
        } else if (analysis.sentiment === 'negative') {
            tags.push({ category: this.tagCategories.BEHAVIOR, tag: 'needs_attention', priority: 'high' });
        }

        return tags;
    }

    // Priority level assignment
    getPriorityTags(analysis, orderStatus) {
        const tags = [];

        // Order-based priority
        if (orderStatus === 'confirming' || orderStatus === 'processing') {
            tags.push({ category: this.tagCategories.PRIORITY, tag: 'immediate_action', priority: 'critical' });
        } else if (orderStatus === 'collecting_info') {
            tags.push({ category: this.tagCategories.PRIORITY, tag: 'follow_up_needed', priority: 'high' });
        }

        // Lead score-based priority
        if (analysis.leadScore >= 60) {
            tags.push({ category: this.tagCategories.PRIORITY, tag: 'hot_lead', priority: 'critical' });
        } else if (analysis.leadScore >= 40) {
            tags.push({ category: this.tagCategories.PRIORITY, tag: 'warm_lead', priority: 'high' });
        } else if (analysis.leadScore >= 20) {
            tags.push({ category: this.tagCategories.PRIORITY, tag: 'cold_lead', priority: 'medium' });
        }

        // Urgency-based priority
        if (analysis.urgencyIndicators && analysis.urgencyIndicators.length > 0) {
            tags.push({ category: this.tagCategories.PRIORITY, tag: 'time_sensitive', priority: 'critical' });
        }

        return tags;
    }

    // Customer segmentation
    getSegmentTags(analysis, mentionedProducts) {
        const tags = [];

        // Product-based segmentation
        if (mentionedProducts && mentionedProducts.length > 0) {
            const categories = [...new Set(mentionedProducts.map(p => p.category))];
            categories.forEach(category => {
                if (category) {
                    tags.push({
                        category: this.tagCategories.SEGMENT,
                        tag: `${category.toLowerCase()}_buyer`,
                        priority: 'medium'
                    });
                }
            });

            // Price range segmentation
            const prices = mentionedProducts.map(p => p.price);
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

            if (avgPrice >= 10000) {
                tags.push({ category: this.tagCategories.SEGMENT, tag: 'premium_buyer', priority: 'high' });
            } else if (avgPrice >= 5000) {
                tags.push({ category: this.tagCategories.SEGMENT, tag: 'mid_range_buyer', priority: 'medium' });
            } else {
                tags.push({ category: this.tagCategories.SEGMENT, tag: 'budget_buyer', priority: 'medium' });
            }
        }

        return tags;
    }

    // Build comprehensive customer profile
    async buildCustomerProfile(customerId, tags, analysis) {
        const profile = {
            customerId,
            lastUpdated: new Date(),

            // Aggregate tag insights
            buyingStage: this.getTagValue(tags, this.tagCategories.BUYING_STAGE),
            interestLevel: this.getTagValue(tags, this.tagCategories.INTEREST_LEVEL),
            customerType: this.getTagValue(tags, this.tagCategories.CUSTOMER_TYPE),
            priority: this.getTagValue(tags, this.tagCategories.PRIORITY),

            // Behavioral indicators
            isUrgent: tags.some(tag => tag.tag === 'urgent_buyer' || tag.tag === 'time_sensitive'),
            isPriceConscious: tags.some(tag => tag.tag === 'price_conscious'),
            isReturningCustomer: tags.some(tag => tag.tag === 'returning_customer'),

            // Score and sentiment
            leadScore: analysis.leadScore,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,

            // Action recommendations
            recommendedActions: this.generateActionRecommendations(tags),
            nextBestAction: this.getNextBestAction(tags)
        };

        return profile;
    }

    // Generate action recommendations based on tags
    generateActionRecommendations(tags) {
        const recommendations = [];

        // Critical priority actions
        if (tags.some(tag => tag.priority === 'critical')) {
            recommendations.push({
                action: 'immediate_response',
                reason: 'High-priority lead detected',
                timeframe: 'within 5 minutes'
            });
        }

        // Order-specific actions
        if (tags.some(tag => tag.tag === 'ready_to_buy')) {
            recommendations.push({
                action: 'process_order',
                reason: 'Customer ready to purchase',
                timeframe: 'immediate'
            });
        }

        // Follow-up actions
        if (tags.some(tag => tag.tag === 'follow_up_needed')) {
            recommendations.push({
                action: 'collect_information',
                reason: 'Missing customer details',
                timeframe: 'within 10 minutes'
            });
        }

        // Nurturing actions
        if (tags.some(tag => tag.tag === 'researcher')) {
            recommendations.push({
                action: 'provide_detailed_info',
                reason: 'Customer is gathering information',
                timeframe: 'within 30 minutes'
            });
        }

        return recommendations;
    }

    // Determine next best action
    getNextBestAction(tags) {
        // Priority order of actions
        const actionPriority = [
            { condition: tag => tag.tag === 'immediate_action', action: 'process_order_immediately' },
            { condition: tag => tag.tag === 'ready_to_buy', action: 'confirm_order_details' },
            { condition: tag => tag.tag === 'hot_lead', action: 'personalized_offer' },
            { condition: tag => tag.tag === 'follow_up_needed', action: 'collect_contact_info' },
            { condition: tag => tag.tag === 'warm_lead', action: 'send_product_details' },
            { condition: tag => tag.tag === 'price_conscious', action: 'offer_discount' },
            { condition: tag => tag.tag === 'researcher', action: 'provide_comparison' },
            { condition: tag => tag.tag === 'cold_lead', action: 'nurture_relationship' }
        ];

        for (const priority of actionPriority) {
            if (tags.some(priority.condition)) {
                return priority.action;
            }
        }

        return 'continue_conversation';
    }

    // Save customer tags to database
    async saveCustomerTags(customerId, tags, profile) {
        try {
            // Save individual tags
            for (const tag of tags) {
                await this.saveIndividualTag(customerId, tag);
            }

            // Save customer profile
            await this.saveCustomerProfile(customerId, profile);

            console.log('🏷️ Customer tags saved:', customerId, tags.length);
        } catch (error) {
            console.error('❌ Error saving customer tags:', error);
        }
    }

    // Save individual tag
    async saveIndividualTag(customerId, tag) {
        const sql = `
            INSERT OR REPLACE INTO customer_tags
            (customer_id, category, tag, priority, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

        return new Promise((resolve, reject) => {
            this.db.db.run(sql, [customerId, tag.category, tag.tag, tag.priority], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save customer profile
    async saveCustomerProfile(customerId, profile) {
        const sql = `
            INSERT OR REPLACE INTO customer_profiles
            (customer_id, buying_stage, interest_level, customer_type, priority_level,
             is_urgent, is_price_conscious, is_returning_customer, lead_score,
             sentiment, confidence, recommended_actions, next_best_action, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const values = [
            customerId,
            profile.buyingStage,
            profile.interestLevel,
            profile.customerType,
            profile.priority,
            profile.isUrgent ? 1 : 0,
            profile.isPriceConscious ? 1 : 0,
            profile.isReturningCustomer ? 1 : 0,
            profile.leadScore,
            profile.sentiment,
            profile.confidence,
            JSON.stringify(profile.recommendedActions),
            profile.nextBestAction
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
    }

    // Utility functions
    getTagValue(tags, category) {
        const categoryTags = tags.filter(tag => tag.category === category);
        return categoryTags.length > 0 ? categoryTags[0].tag : null;
    }

    deduplicateTags(tags) {
        const seen = new Set();
        return tags.filter(tag => {
            const key = `${tag.category}:${tag.tag}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    generateRecommendations(tags, profile) {
        return {
            salesApproach: this.getSalesApproach(tags),
            messagingTone: this.getMessagingTone(profile),
            offerStrategy: this.getOfferStrategy(tags),
            followUpTiming: this.getFollowUpTiming(tags)
        };
    }

    getSalesApproach(tags) {
        if (tags.some(tag => tag.tag === 'researcher')) return 'educational';
        if (tags.some(tag => tag.tag === 'price_conscious')) return 'value_focused';
        if (tags.some(tag => tag.tag === 'urgent_buyer')) return 'direct_close';
        return 'consultative';
    }

    getMessagingTone(profile) {
        if (profile.sentiment === 'positive') return 'enthusiastic';
        if (profile.isUrgent) return 'responsive';
        if (profile.isPriceConscious) return 'value_oriented';
        return 'professional';
    }

    getOfferStrategy(tags) {
        if (tags.some(tag => tag.tag === 'price_conscious')) return 'discount_focused';
        if (tags.some(tag => tag.tag === 'premium_buyer')) return 'quality_focused';
        if (tags.some(tag => tag.tag === 'urgent_buyer')) return 'urgency_based';
        return 'benefit_focused';
    }

    getFollowUpTiming(tags) {
        if (tags.some(tag => tag.priority === 'critical')) return 'immediate';
        if (tags.some(tag => tag.priority === 'high')) return 'within_hour';
        if (tags.some(tag => tag.priority === 'medium')) return 'within_day';
        return 'within_week';
    }
}

module.exports = LeadTaggingSystem;