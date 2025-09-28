// AI Agent Business Setup Wizard
// Intelligently gathers seller information and trains the AI agent

class BusinessSetupWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.businessData = {
            businessInfo: {},
            products: [],
            faqs: [],
            targetCustomers: {},
            salesStrategy: {}
        };
        this.productCounter = 0;
        this.faqCounter = 0;

        this.init();
    }

    init() {
        console.log('🧙‍♂️ Business Setup Wizard initialized');

        // Check for imported data from Smart Import
        this.loadImportedData();

        this.updateProgress();
        this.addInitialForms();
    }

    // Load data from Smart Import if available
    loadImportedData() {
        try {
            const importedData = localStorage.getItem('extractedBusinessData');
            console.log('🔍 Checking for imported data:', importedData ? 'Found' : 'Not found');
            if (importedData) {
                console.log('📦 Loading imported business data...');
                const data = JSON.parse(importedData);
                console.log('📊 Parsed data:', data);

                // Pre-fill business info
                if (data.business_info) {
                    this.businessData.businessInfo = {
                        name: data.business_info.name || '',
                        category: data.business_info.type || data.business_info.category || '',
                        description: data.business_info.description || '',
                        location: data.business_info.location || ''
                    };
                }

                // Pre-fill products
                if (data.products && data.products.length > 0) {
                    this.businessData.products = data.products.map(product => ({
                        name: product.name || '',
                        price: product.price || '',
                        category: product.category || '',
                        description: product.description || '',
                        keywords: Array.isArray(product.keywords) ? product.keywords.join(', ') : ''
                    }));
                }

                // Pre-fill FAQs
                if (data.faqs && data.faqs.length > 0) {
                    this.businessData.faqs = data.faqs.map(faq => ({
                        question: faq.question || '',
                        answer: faq.answer || '',
                        category: faq.category || 'general'
                    }));
                }

                // Pre-fill business details
                if (data.business_details) {
                    this.businessData.businessDetails = data.business_details;
                }

                // Show import success message
                this.showImportSuccess(data);

                // Populate form fields with imported data after a short delay
                setTimeout(() => {
                    this.populateFormsWithImportedData();
                }, 500);

                // Clear the imported data
                localStorage.removeItem('extractedBusinessData');

                console.log('✅ Imported data loaded successfully');
            }
        } catch (error) {
            console.error('❌ Error loading imported data:', error);
        }
    }

    // Show import success message
    showImportSuccess(data) {
        const successMessage = document.createElement('div');
        successMessage.className = 'import-success-banner';
        successMessage.innerHTML = `
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <h3>🎉 Smart Import Successful!</h3>
                <p>AI extracted your business data automatically:</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; flex-wrap: wrap;">
                    <span><strong>${data.products?.length || 0}</strong> Products</span>
                    <span><strong>${data.faqs?.length || 0}</strong> FAQs</span>
                    <span><strong>1</strong> Business Profile</span>
                </div>
                <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">Review and customize the pre-filled information below</p>
            </div>
        `;

        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(successMessage, container.firstChild);

            // Auto-remove after 10 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 10000);
        }
    }

    // Populate form fields with imported data
    populateFormsWithImportedData() {
        console.log('📝 Populating forms with imported data...');

        // Step 1: Business Info
        if (this.businessData.businessInfo) {
            const businessName = document.getElementById('businessName');
            const businessType = document.getElementById('businessType');
            const businessDescription = document.getElementById('businessDescription');
            const businessHours = document.getElementById('businessHours');
            const email = document.getElementById('email');

            if (businessName && this.businessData.businessInfo.name) {
                businessName.value = this.businessData.businessInfo.name;
                console.log('✅ Set business name:', this.businessData.businessInfo.name);
            }
            if (businessType && this.businessData.businessInfo.category) {
                // Intelligently map AI category to dropdown options
                const aiCategory = this.businessData.businessInfo.category.toLowerCase();
                const categoryMappings = {
                    'retail': 'retail',
                    'essential oils': 'health',
                    'oils': 'health',
                    'beauty': 'beauty',
                    'health': 'health',
                    'wellness': 'health',
                    'food': 'food',
                    'restaurant': 'food',
                    'clothing': 'fashion',
                    'fashion': 'fashion',
                    'services': 'services',
                    'technology': 'technology',
                    'education': 'education'
                };

                // Find best match or use the AI category directly
                let selectedCategory = businessType.value;
                for (const [key, value] of Object.entries(categoryMappings)) {
                    if (aiCategory.includes(key)) {
                        selectedCategory = value;
                        break;
                    }
                }

                // If no mapping found, try to add the AI category as an option
                if (!selectedCategory || selectedCategory === businessType.value) {
                    const newOption = document.createElement('option');
                    newOption.value = this.businessData.businessInfo.category;
                    newOption.textContent = this.businessData.businessInfo.category;
                    businessType.appendChild(newOption);
                    selectedCategory = this.businessData.businessInfo.category;
                }

                businessType.value = selectedCategory;
                console.log('✅ Set business type:', selectedCategory);
            }
            if (businessDescription && this.businessData.businessInfo.description) {
                businessDescription.value = this.businessData.businessInfo.description;
                console.log('✅ Set business description');
            }
            if (businessHours && this.businessData.businessDetails?.business_hours) {
                businessHours.value = this.businessData.businessDetails.business_hours;
                console.log('✅ Set business hours');
            }
            if (email && this.businessData.businessDetails?.contact_info?.email) {
                email.value = this.businessData.businessDetails.contact_info.email;
                console.log('✅ Set email');
            }

            // Intelligently fill additional fields from AI data
            const phoneInput = document.getElementById('phone');
            const locationInput = document.getElementById('location');

            if (phoneInput && this.businessData.businessDetails?.contact_info?.phone) {
                phoneInput.value = this.businessData.businessDetails.contact_info.phone;
                console.log('✅ Set phone:', this.businessData.businessDetails.contact_info.phone);
            }

            if (locationInput && this.businessData.businessDetails?.contact_info?.address) {
                locationInput.value = this.businessData.businessDetails.contact_info.address;
                console.log('✅ Set location:', this.businessData.businessDetails.contact_info.address);
            }

            // Auto-check payment methods based on AI extraction
            if (this.businessData.businessDetails?.payment_methods) {
                const paymentMethods = this.businessData.businessDetails.payment_methods;

                // Check appropriate payment method checkboxes
                if (paymentMethods.includes('COD') || paymentMethods.includes('Cash on Delivery')) {
                    const codCheckbox = document.querySelector('input[type="checkbox"][value*="cod"]') ||
                                       document.querySelector('input[type="checkbox"]') ||
                                       document.getElementById('cod');
                    if (codCheckbox) {
                        codCheckbox.checked = true;
                        console.log('✅ Set COD payment method');
                    }
                }

                if (paymentMethods.includes('GCash')) {
                    const gcashCheckbox = document.querySelector('input[type="checkbox"][value*="gcash"]') ||
                                         document.getElementById('gcash');
                    if (gcashCheckbox) {
                        gcashCheckbox.checked = true;
                        console.log('✅ Set GCash payment method');
                    }
                }

                if (paymentMethods.includes('Bank Transfer')) {
                    const bankCheckbox = document.querySelector('input[type="checkbox"][value*="bank"]') ||
                                        document.getElementById('bank');
                    if (bankCheckbox) {
                        bankCheckbox.checked = true;
                        console.log('✅ Set Bank Transfer payment method');
                    }
                }
            }
        }

        // Clear existing product forms and add imported products
        if (this.businessData.products && this.businessData.products.length > 0) {
            const productContainer = document.getElementById('productsContainer');
            if (productContainer) {
                productContainer.innerHTML = ''; // Clear existing forms
                this.productCounter = 0;

                // Add each imported product
                this.businessData.products.forEach((product, index) => {
                    this.addProductForm();
                    const currentForm = productContainer.lastElementChild;

                    if (currentForm) {
                        const nameInput = currentForm.querySelector('.product-name');
                        const priceInput = currentForm.querySelector('.product-price');
                        const categoryInput = currentForm.querySelector('.product-category');
                        const descriptionInput = currentForm.querySelector('.product-description');

                        if (nameInput) {
                            nameInput.value = product.name || '';
                            console.log('✅ Set product name:', product.name);
                        }
                        if (priceInput) {
                            priceInput.value = product.price || '';
                            console.log('✅ Set product price:', product.price);
                        }
                        if (categoryInput) {
                            categoryInput.value = product.category || '';
                            console.log('✅ Set product category:', product.category);
                        }
                        if (descriptionInput) {
                            descriptionInput.value = product.description || '';
                            console.log('✅ Set product description');
                        }
                    }
                });
            }
        }

        // Clear existing FAQ forms and add imported FAQs
        if (this.businessData.faqs && this.businessData.faqs.length > 0) {
            const faqContainer = document.getElementById('faqsContainer');
            if (faqContainer) {
                faqContainer.innerHTML = ''; // Clear existing forms
                this.faqCounter = 0;

                // Add each imported FAQ
                this.businessData.faqs.forEach((faq, index) => {
                    this.addFAQForm();
                    const currentForm = faqContainer.lastElementChild;

                    if (currentForm) {
                        const questionInput = currentForm.querySelector('.faq-question');
                        const answerInput = currentForm.querySelector('.faq-answer');

                        if (questionInput) {
                            questionInput.value = faq.question || '';
                            console.log('✅ Set FAQ question:', faq.question);
                        }
                        if (answerInput) {
                            answerInput.value = faq.answer || '';
                            console.log('✅ Set FAQ answer');
                        }
                    }
                });
            }
        }

        console.log('✅ Forms populated with imported data');
    }

    // Add initial product and FAQ forms
    addInitialForms() {
        // Only add default forms if no imported data
        const hasImportedProducts = this.businessData.products && this.businessData.products.length > 0;
        const hasImportedFAQs = this.businessData.faqs && this.businessData.faqs.length > 0;

        if (!hasImportedProducts) {
            // Add one product form to start
            this.addProductForm();
        }

        if (!hasImportedFAQs) {
            // Add a few FAQ forms to start
            this.addFAQForm();
            this.addFAQForm();
        }
    }

    // Navigation
    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();

            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateProgress();
                this.updateNavigation();

                // Generate AI preview on last step
                if (this.currentStep === this.totalSteps) {
                    this.generateAIPreview();
                    this.trainAIAgent();
                }
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        document.getElementById(`step${stepNumber}`).classList.add('active');

        // Update step indicator
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < stepNumber) {
                step.classList.add('completed');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
            }
        });
    }

    updateProgress() {
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        document.getElementById('progressBar').style.width = progressPercentage + '%';
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        // Show/hide previous button
        if (this.currentStep === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-flex';
        }

        // Update next button text
        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
        } else if (this.currentStep === this.totalSteps - 1) {
            nextBtn.innerHTML = '<i class="fas fa-magic"></i> Train AI Agent';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }

    // Validation
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateBusinessInfo();
            case 2:
                return this.validateProducts();
            case 3:
                return this.validateFAQs();
            case 4:
                return this.validateTargetCustomers();
            case 5:
                return this.validateSalesStrategy();
            default:
                return true;
        }
    }

    validateBusinessInfo() {
        const businessName = document.getElementById('businessName').value.trim();
        const businessType = document.getElementById('businessType').value;
        const businessDescription = document.getElementById('businessDescription').value.trim();

        if (!businessName) {
            this.showError('Business name is required');
            return false;
        }

        if (!businessType) {
            this.showError('Please select a business category');
            return false;
        }

        if (!businessDescription || businessDescription.length < 20) {
            this.showError('Please provide a detailed business description (at least 20 characters)');
            return false;
        }

        return true;
    }

    validateProducts() {
        const products = this.collectProductData();

        if (products.length === 0) {
            this.showError('Please add at least one product');
            return false;
        }

        // Check if all products have required fields
        for (let product of products) {
            if (!product.name || !product.price || !product.description) {
                this.showError('All products must have name, price, and description');
                return false;
            }
        }

        return true;
    }

    validateFAQs() {
        const faqs = this.collectFAQData();

        if (faqs.length === 0) {
            this.showError('Please add at least one FAQ to help train your AI');
            return false;
        }

        return true;
    }

    validateTargetCustomers() {
        const painPoints = document.getElementById('customerPainPoints').value.trim();

        if (!painPoints) {
            this.showError('Please describe what problems your products solve');
            return false;
        }

        return true;
    }

    validateSalesStrategy() {
        const salesTone = document.getElementById('salesTone').value;

        if (!salesTone) {
            this.showError('Please select a sales tone');
            return false;
        }

        return true;
    }

    // Data Collection
    saveCurrentStepData() {
        switch (this.currentStep) {
            case 1:
                this.saveBusinessInfo();
                break;
            case 2:
                this.saveProducts();
                break;
            case 3:
                this.saveFAQs();
                break;
            case 4:
                this.saveTargetCustomers();
                break;
            case 5:
                this.saveSalesStrategy();
                break;
        }
    }

    saveBusinessInfo() {
        const paymentMethods = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        this.businessData.businessInfo = {
            shopName: document.getElementById('businessName').value,
            businessType: document.getElementById('businessType').value,
            location: document.getElementById('location').value,
            description: document.getElementById('businessDescription').value,
            businessHours: document.getElementById('businessHours').value,
            contactInfo: {
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value
            },
            paymentMethods: paymentMethods
        };

        console.log('💼 Business info saved:', this.businessData.businessInfo);
    }

    saveProducts() {
        this.businessData.products = this.collectProductData();
        console.log('📦 Products saved:', this.businessData.products);
    }

    saveFAQs() {
        this.businessData.faqs = this.collectFAQData();
        console.log('❓ FAQs saved:', this.businessData.faqs);
    }

    saveTargetCustomers() {
        const ageRanges = Array.from(document.querySelectorAll('input[id^="age"]:checked'))
            .map(cb => cb.value);

        const interests = Array.from(document.querySelectorAll('input[id^="natural"], input[id^="organic"], input[id^="health"], input[id^="quality"], input[id^="affordable"], input[id^="authentic"]:checked'))
            .map(cb => cb.value);

        this.businessData.targetCustomers = {
            ageRanges: ageRanges,
            interests: interests,
            painPoints: document.getElementById('customerPainPoints').value,
            buyingMotivations: document.getElementById('buyingMotivations').value
        };

        console.log('🎯 Target customers saved:', this.businessData.targetCustomers);
    }

    saveSalesStrategy() {
        const salesTactics = Array.from(document.querySelectorAll('input[id^="education"], input[id^="benefits"], input[id^="urgency"], input[id^="social"], input[id^="value"]:checked'))
            .map(cb => cb.value);

        this.businessData.salesStrategy = {
            tone: document.getElementById('salesTone').value,
            tactics: salesTactics,
            promotions: document.getElementById('promotions').value,
            objectionHandling: document.getElementById('objectionHandling').value
        };

        console.log('📈 Sales strategy saved:', this.businessData.salesStrategy);
    }

    collectProductData() {
        const products = [];
        const productForms = document.querySelectorAll('.product-form');

        productForms.forEach((form, index) => {
            const name = form.querySelector('.product-name').value.trim();
            const price = parseFloat(form.querySelector('.product-price').value);
            const description = form.querySelector('.product-description').value.trim();
            const category = form.querySelector('.product-category').value.trim();
            const stock = parseInt(form.querySelector('.product-stock').value) || 0;
            const benefits = form.querySelector('.product-benefits').value.trim();
            const keywords = form.querySelector('.product-keywords').value.trim();

            if (name && price && description) {
                products.push({
                    id: `product_${index + 1}`,
                    name: name,
                    price: price,
                    description: description,
                    category: category || 'General',
                    stock: stock,
                    benefits: benefits,
                    keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
                });
            }
        });

        return products;
    }

    collectFAQData() {
        const faqs = [];
        const faqForms = document.querySelectorAll('.faq-form');

        faqForms.forEach((form, index) => {
            const question = form.querySelector('.faq-question').value.trim();
            const answer = form.querySelector('.faq-answer').value.trim();
            const keywords = form.querySelector('.faq-keywords').value.trim();

            if (question && answer) {
                faqs.push({
                    id: `faq_${index + 1}`,
                    question: question,
                    answer: answer,
                    keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
                });
            }
        });

        return faqs;
    }

    // Dynamic Form Generation
    addProductForm() {
        this.productCounter++;
        const container = document.getElementById('productsContainer');

        const productForm = document.createElement('div');
        productForm.className = 'product-form';
        productForm.innerHTML = `
            <h4><i class="fas fa-box"></i> Product ${this.productCounter}</h4>
            <div class="form-row">
                <div class="form-group">
                    <label>Product Name *</label>
                    <input type="text" class="form-control product-name" placeholder="e.g., Lavender Essential Oil (10ml)" required>
                </div>
                <div class="form-group">
                    <label>Price (₱) *</label>
                    <input type="number" class="form-control product-price" step="0.01" placeholder="450" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" class="form-control product-category" placeholder="e.g., Essential Oils">
                </div>
                <div class="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" class="form-control product-stock" placeholder="50">
                </div>
            </div>
            <div class="form-group">
                <label>Product Description *</label>
                <textarea class="form-control product-description" rows="3"
                    placeholder="Describe your product in detail. What makes it special?" required></textarea>
            </div>
            <div class="form-group">
                <label>Key Benefits</label>
                <textarea class="form-control product-benefits" rows="2"
                    placeholder="e.g., Stress relief, better sleep, skin care, natural healing"></textarea>
            </div>
            <div class="form-group">
                <label>Keywords (comma separated)</label>
                <input type="text" class="form-control product-keywords"
                    placeholder="e.g., lavender, sleep, relaxation, stress, anxiety, pure, therapeutic">
            </div>
            <button type="button" class="btn btn-outline" onclick="removeProductForm(this)" style="float: right;">
                <i class="fas fa-trash"></i> Remove Product
            </button>
            <div style="clear: both;"></div>
        `;

        container.appendChild(productForm);
    }

    addFAQForm() {
        this.faqCounter++;
        const container = document.getElementById('faqsContainer');

        const faqForm = document.createElement('div');
        faqForm.className = 'faq-form';
        faqForm.innerHTML = `
            <h4><i class="fas fa-question"></i> Q&A ${this.faqCounter}</h4>
            <div class="form-group">
                <label>Customer Question *</label>
                <input type="text" class="form-control faq-question"
                    placeholder="e.g., Are your essential oils 100% pure?" required>
            </div>
            <div class="form-group">
                <label>Your Answer *</label>
                <textarea class="form-control faq-answer" rows="3"
                    placeholder="Provide a helpful, detailed answer that builds trust and addresses concerns" required></textarea>
            </div>
            <div class="form-group">
                <label>Related Keywords (comma separated)</label>
                <input type="text" class="form-control faq-keywords"
                    placeholder="e.g., pure, authentic, quality, certification, organic">
            </div>
            <button type="button" class="btn btn-outline" onclick="removeFAQForm(this)" style="float: right;">
                <i class="fas fa-trash"></i> Remove Q&A
            </button>
            <div style="clear: both;"></div>
        `;

        container.appendChild(faqForm);
    }

    // AI Training and Preview
    async trainAIAgent() {
        console.log('🧠 Training AI Agent with collected data...');

        try {
            // Send all collected data to the backend for AI training
            const response = await fetch('/config/business', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopName: this.businessData.businessInfo.shopName,
                    businessType: this.businessData.businessInfo.businessType,
                    location: this.businessData.businessInfo.location,
                    businessInfo: this.businessData.businessInfo,
                    products: this.businessData.products,
                    faqs: this.businessData.faqs,
                    targetCustomers: this.businessData.targetCustomers,
                    salesStrategy: this.businessData.salesStrategy
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ AI Agent trained successfully!');
                this.showSuccess('Your AI Agent has been trained and is ready to serve customers!');
            } else {
                throw new Error(result.error || 'Training failed');
            }

        } catch (error) {
            console.error('❌ AI training error:', error);
            this.showError('Failed to train AI agent. Please try again.');
        }
    }

    generateAIPreview() {
        // Generate a sample AI response based on collected data
        const businessName = this.businessData.businessInfo.shopName;
        const products = this.businessData.products;
        const tone = this.businessData.salesStrategy.tone || 'friendly';

        let greeting = '';
        switch (tone) {
            case 'consultative':
                greeting = 'Hello! I\'m here to help you find exactly what you need. How can I assist you today?';
                break;
            case 'professional':
                greeting = `Good day! Welcome to ${businessName}. How may I be of service?`;
                break;
            case 'enthusiastic':
                greeting = `Hi there! Welcome to ${businessName}! I\'m excited to help you discover our amazing products! 🌟`;
                break;
            default:
                greeting = `Welcome to ${businessName}! 😊 How can I help you today?`;
        }

        const sampleResponse = `${greeting}

${products.length > 0 ? `We specialize in ${products[0].category?.toLowerCase() || 'quality products'} and I'd love to help you find the perfect solution!` : ''}

Feel free to ask me about:
${products.slice(0, 3).map(p => `• ${p.name}`).join('\n')}
${products.length > 3 ? `• And ${products.length - 3} more products!` : ''}

What specific needs can I help you with?`;

        document.getElementById('aiResponsePreview').textContent = sampleResponse;
    }

    // Utility Functions
    showError(message) {
        // Create error alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            color: #991b1b;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #fecaca;
            z-index: 9999;
            max-width: 400px;
        `;
        alert.textContent = message;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d1fae5;
            color: #065f46;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #a7f3d0;
            z-index: 9999;
            max-width: 400px;
        `;
        alert.textContent = message;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Final Actions
    goToDashboard() {
        window.location.href = '/dashboard';
    }

    testAgent() {
        window.open('/test.html', '_blank');
    }
}

// Global Functions
let wizard;

function addProductForm() {
    wizard.addProductForm();
}

function addFAQForm() {
    wizard.addFAQForm();
}

function removeProductForm(button) {
    button.closest('.product-form').remove();
}

function removeFAQForm(button) {
    button.closest('.faq-form').remove();
}

function nextStep() {
    wizard.nextStep();
}

function prevStep() {
    wizard.prevStep();
}

function goToDashboard() {
    wizard.goToDashboard();
}

function testAgent() {
    wizard.testAgent();
}

// Initialize wizard when page loads
document.addEventListener('DOMContentLoaded', () => {
    wizard = new BusinessSetupWizard();
    console.log('✨ Business Setup Wizard ready for seller onboarding!');
});

// Sample data for essential oils demo (you can pre-fill for testing)
function loadEssentialOilsDemo() {
    // Pre-fill business info
    document.getElementById('businessName').value = 'Pure Essence Naturals';
    document.getElementById('businessType').value = 'health-wellness';
    document.getElementById('businessDescription').value = 'We specialize in 100% authentic, therapeutic-grade essential oils sourced directly from certified organic farms worldwide. No synthetic additives, just pure nature\'s healing power for wellness, aromatherapy, and natural health solutions.';
    document.getElementById('location').value = 'Metro Manila, Philippines';
    document.getElementById('businessHours').value = 'Mon-Sat 9AM-8PM, Sun 10AM-6PM';
    document.getElementById('phone').value = '+63 917 555 0123';
    document.getElementById('email').value = 'orders@pureessencenaturals.com';

    // Check payment methods
    document.getElementById('gcash').checked = true;
    document.getElementById('bank').checked = true;
    document.getElementById('cod').checked = true;

    console.log('🌿 Essential oils demo data loaded');
}