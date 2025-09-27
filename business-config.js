// Business Configuration System
// Allows sellers to input their business data for AI training

class BusinessConfig {
  constructor() {
    this.config = this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      // Basic business information
      shopName: 'Your Business Name',
      businessType: 'retail', // retail, service, digital, etc.
      location: 'Metro Manila',

      // Business details
      businessInfo: {
        description: 'We sell quality products at affordable prices',
        established: '2024',
        specialties: [],
        paymentMethods: ['Cash', 'GCash', 'Bank Transfer', 'Credit Card'],
        shippingZones: ['Metro Manila', 'Luzon', 'Visayas', 'Mindanao'],
        shippingFee: '₱50-150',
        freeShippingMinimum: 1000,
        businessHours: 'Mon-Sat 9AM-6PM',
        socialMedia: {
          facebook: '',
          instagram: '',
          website: ''
        }
      },

      // Product catalog
      products: [
        {
          id: 'p1',
          name: 'Sample Product',
          price: 999,
          description: 'High-quality product with great features',
          category: 'Electronics',
          stock: 50,
          images: [],
          keywords: ['sample', 'product', 'quality'],
          specifications: {},
          variants: [] // colors, sizes, etc.
        }
      ],

      // Services offered
      services: [
        {
          id: 's1',
          name: 'Sample Service',
          price: 500,
          description: 'Professional service with guaranteed results',
          duration: '1-2 hours',
          category: 'Professional Services',
          keywords: ['service', 'professional', 'quality']
        }
      ],

      // FAQ database
      faqs: [
        {
          id: 'faq1',
          question: 'Do you offer warranty?',
          answer: 'Yes, we provide 1-year warranty on all products with free repair or replacement.',
          keywords: ['warranty', 'guarantee', 'repair', 'replacement']
        },
        {
          id: 'faq2',
          question: 'What are your payment options?',
          answer: 'We accept Cash, GCash, Bank Transfer, and Credit Card payments.',
          keywords: ['payment', 'pay', 'cash', 'gcash', 'bank', 'credit card']
        },
        {
          id: 'faq3',
          question: 'How long is shipping?',
          answer: 'Metro Manila: 1-2 days, Provincial: 3-5 days. We ship nationwide!',
          keywords: ['shipping', 'delivery', 'how long', 'days', 'time']
        }
      ],

      // Sales scripts for different scenarios
      salesScripts: {
        objectionHandling: {
          'too expensive': 'I understand budget is important. Let me show you our payment plans and current promotions.',
          'not sure': 'That\'s totally fine! What specific concerns do you have? I\'m here to help you make the best decision.',
          'thinking about it': 'Of course! Take your time. Can I send you more details to help with your decision?'
        },

        urgencyBuilders: [
          'We have limited stock - only {stock} units left!',
          'Special promotion ends this week!',
          'Free shipping if you order today!'
        ],

        closingQuestions: [
          'What would make this a perfect fit for you?',
          'When would you like to receive this?',
          'Would you prefer to order now or need more information first?'
        ]
      },

      // Customer personas and targeting
      targetCustomers: [
        {
          type: 'budget_conscious',
          characteristics: ['price-sensitive', 'compares options', 'asks about discounts'],
          approach: 'Emphasize value, show payment options, highlight savings'
        },
        {
          type: 'quality_focused',
          characteristics: ['asks about specifications', 'warranty concerns', 'brand conscious'],
          approach: 'Highlight quality, provide detailed specs, mention certifications'
        },
        {
          type: 'urgent_buyer',
          characteristics: ['needs immediately', 'asks about availability', 'time-sensitive'],
          approach: 'Confirm stock, expedite shipping, provide quick solutions'
        }
      ],

      // Lead qualification criteria
      leadScoring: {
        highValue: {
          keywords: ['buy now', 'order', 'urgent', 'need today'],
          score: 25
        },
        mediumValue: {
          keywords: ['price', 'cost', 'available', 'when can'],
          score: 15
        },
        lowValue: {
          keywords: ['just looking', 'maybe later', 'just browsing'],
          score: 5
        }
      },

      // Response personalization
      responseTemplates: {
        greeting: [
          'Welcome to {shopName}! How can I help you today?',
          'Hi there! Thanks for visiting {shopName}. What are you looking for?',
          'Hello! I\'m here to help you find exactly what you need at {shopName}!'
        ],

        productInquiry: [
          'Great choice! Our {productName} is one of our bestsellers.',
          'You have excellent taste! The {productName} is perfect for...',
          'I\'d love to tell you about our {productName}!'
        ],

        pricing: [
          'Our {productName} is competitively priced at ₱{price}.',
          'For ₱{price}, you\'re getting incredible value with {productName}.',
          'The {productName} is ₱{price} - and worth every peso!'
        ]
      }
    };
  }

  // Methods for sellers to input their data
  updateBasicInfo(shopName, businessType, location, description) {
    this.config.shopName = shopName;
    this.config.businessType = businessType;
    this.config.location = location;
    this.config.businessInfo.description = description;
    return this;
  }

  addProduct(productData) {
    const product = {
      id: `p${this.config.products.length + 1}`,
      name: productData.name,
      price: productData.price,
      description: productData.description,
      category: productData.category || 'General',
      stock: productData.stock || 0,
      keywords: productData.keywords || [],
      specifications: productData.specifications || {},
      variants: productData.variants || [],
      images: productData.images || []
    };

    this.config.products.push(product);
    return this;
  }

  addService(serviceData) {
    const service = {
      id: `s${this.config.services.length + 1}`,
      name: serviceData.name,
      price: serviceData.price,
      description: serviceData.description,
      duration: serviceData.duration,
      category: serviceData.category || 'Services',
      keywords: serviceData.keywords || []
    };

    this.config.services.push(service);
    return this;
  }

  addFAQ(question, answer, keywords = []) {
    const faq = {
      id: `faq${this.config.faqs.length + 1}`,
      question,
      answer,
      keywords: keywords.length > 0 ? keywords : this.extractKeywords(question + ' ' + answer)
    };

    this.config.faqs.push(faq);
    return this;
  }

  updateBusinessInfo(info) {
    this.config.businessInfo = { ...this.config.businessInfo, ...info };
    return this;
  }

  addSalesScript(situation, response) {
    if (!this.config.salesScripts.custom) {
      this.config.salesScripts.custom = {};
    }
    this.config.salesScripts.custom[situation] = response;
    return this;
  }

  // Helper methods
  extractKeywords(text) {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'from', 'they', 'been', 'have'].includes(word));

    return [...new Set(words)]; // Remove duplicates
  }

  // Import/Export configuration
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson) {
    try {
      this.config = JSON.parse(configJson);
      return true;
    } catch (error) {
      console.error('Invalid configuration JSON:', error);
      return false;
    }
  }

  // Get configuration for AI engine
  getAIConfig() {
    return this.config;
  }

  // Validation
  validateConfig() {
    const errors = [];

    if (!this.config.shopName || this.config.shopName === 'Your Business Name') {
      errors.push('Shop name is required');
    }

    if (this.config.products.length === 0) {
      errors.push('At least one product is required');
    }

    if (this.config.faqs.length === 0) {
      errors.push('At least one FAQ is recommended');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Setup wizard for new customers
  static createSetupWizard() {
    return {
      steps: [
        {
          step: 1,
          title: 'Basic Business Information',
          fields: ['shopName', 'businessType', 'location', 'description'],
          required: ['shopName', 'businessType']
        },
        {
          step: 2,
          title: 'Add Your Products',
          action: 'addProducts',
          minItems: 1
        },
        {
          step: 3,
          title: 'Business Policies',
          fields: ['paymentMethods', 'shippingZones', 'businessHours'],
          required: ['paymentMethods']
        },
        {
          step: 4,
          title: 'Common Questions (FAQ)',
          action: 'addFAQs',
          suggested: [
            'Do you offer warranty?',
            'What are your payment options?',
            'How long is shipping?',
            'Do you have physical store?',
            'Can I return/exchange items?'
          ]
        },
        {
          step: 5,
          title: 'Review and Test',
          action: 'testBot'
        }
      ]
    };
  }

  // Sample data for demo
  static getDemoConfig() {
    const demo = new BusinessConfig();

    demo.updateBasicInfo(
      'TechHub Philippines',
      'retail',
      'Quezon City',
      'We sell the latest gadgets and tech accessories at unbeatable prices'
    );

    demo.addProduct({
      name: 'iPhone 15 Pro',
      price: 65000,
      description: 'Latest iPhone with pro camera system and titanium design',
      category: 'Smartphones',
      stock: 25,
      keywords: ['iphone', 'apple', 'smartphone', 'pro', 'camera'],
      specifications: {
        storage: '128GB',
        color: 'Natural Titanium',
        warranty: '1 year'
      }
    });

    demo.addProduct({
      name: 'AirPods Pro 2',
      price: 12000,
      description: 'Premium wireless earbuds with active noise cancellation',
      category: 'Audio',
      stock: 50,
      keywords: ['airpods', 'wireless', 'earbuds', 'apple', 'noise cancellation']
    });

    demo.addProduct({
      name: 'MacBook Air M3',
      price: 75000,
      description: 'Ultra-thin laptop with M3 chip for professionals',
      category: 'Laptops',
      stock: 15,
      keywords: ['macbook', 'laptop', 'apple', 'm3', 'professional']
    });

    demo.addFAQ(
      'Do you offer installment?',
      'Yes! We offer 0% installment plans for 6-12 months through major credit cards.',
      ['installment', 'payment', 'credit card', 'monthly']
    );

    demo.addFAQ(
      'Are your products authentic?',
      'Absolutely! All our products are 100% authentic with official warranty.',
      ['authentic', 'original', 'warranty', 'genuine']
    );

    demo.updateBusinessInfo({
      paymentMethods: ['Cash', 'GCash', 'Bank Transfer', 'Credit Card', 'Installment'],
      freeShippingMinimum: 2000,
      businessHours: 'Mon-Sat 10AM-8PM, Sun 12PM-6PM'
    });

    return demo.getAIConfig();
  }
}

module.exports = BusinessConfig;