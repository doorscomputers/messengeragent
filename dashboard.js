// FB Messenger Agent Seller Dashboard JavaScript
// Handles all dashboard functionality and API communications

class SellerDashboard {
    constructor() {
        this.config = null;
        this.leads = [];
        this.interactions = [];
        this.currentEditingProduct = null;
        this.currentEditingFAQ = null;

        this.init();
    }

    init() {
        console.log('🚀 Initializing FB Messenger Agent Dashboard...');
        this.loadConfiguration();
        this.loadLeads();
        this.loadInteractions();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Setup modal close listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadLeads();
            this.loadInteractions();
        }, 30000);
    }

    // Navigation
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Activate corresponding tab
        event.target.classList.add('active');

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'overview':
                this.updateOverviewStats();
                this.loadRecentLeads();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'business':
                this.loadBusinessInfo();
                break;
            case 'faqs':
                this.loadFAQs();
                break;
            case 'leads':
                this.loadAllLeads();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // API Communication
    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(endpoint, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API call failed');
            }

            return result;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            this.showAlert('error', `Error: ${error.message}`);
            throw error;
        }
    }

    // Configuration Management
    async loadConfiguration() {
        try {
            const result = await this.apiCall('/config/business');
            this.config = result.config;
            console.log('✅ Configuration loaded:', this.config);
        } catch (error) {
            console.warn('⚠️ Could not load configuration, using defaults');
            this.config = this.getDefaultConfig();
        }
    }

    async saveConfiguration() {
        try {
            await this.apiCall('/config/business', 'POST', this.config);
            this.showAlert('success', 'Configuration saved successfully!');
            return true;
        } catch (error) {
            this.showAlert('error', 'Failed to save configuration');
            return false;
        }
    }

    getDefaultConfig() {
        return {
            shopName: 'Your Business Name',
            businessType: 'retail',
            location: 'Metro Manila',
            businessInfo: {
                description: 'We sell quality products at affordable prices',
                paymentMethods: ['Cash', 'GCash', 'Bank Transfer'],
                businessHours: 'Mon-Sat 9AM-6PM',
                contactInfo: {
                    phone: '+63 917 123 4567',
                    email: 'sales@yourbusiness.com'
                }
            },
            products: [],
            faqs: []
        };
    }

    // Overview Section
    async updateOverviewStats() {
        try {
            // Load interactions
            const interactionsResult = await this.apiCall('/interactions');
            this.interactions = interactionsResult.interactions || [];

            // Load leads
            const leadsResult = await this.apiCall('/leads');
            this.leads = leadsResult.leads || [];

            // Calculate stats
            const totalInteractions = this.interactions.length;
            const totalLeads = this.leads.length;
            const hotLeads = this.leads.filter(lead => lead.urgency === 'high').length;
            const conversionRate = totalInteractions > 0 ? ((totalLeads / totalInteractions) * 100).toFixed(1) : 0;

            // Update UI
            document.getElementById('totalInteractions').textContent = totalInteractions;
            document.getElementById('totalLeads').textContent = totalLeads;
            document.getElementById('hotLeads').textContent = hotLeads;
            document.getElementById('conversionRate').textContent = conversionRate + '%';

        } catch (error) {
            console.error('Failed to load overview stats:', error);
        }
    }

    async loadRecentLeads() {
        try {
            const tbody = document.querySelector('#recentLeadsTable tbody');

            if (this.leads.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--gray-600);">
                            No leads yet. Start promoting your bot to get customers!
                        </td>
                    </tr>
                `;
                return;
            }

            // Show only the 5 most recent leads
            const recentLeads = this.leads
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);

            tbody.innerHTML = recentLeads.map(lead => `
                <tr>
                    <td>${lead.customer || 'Unknown'}</td>
                    <td>${this.truncateText(lead.lastMessage || '', 30)}</td>
                    <td>
                        <span class="badge badge-${this.getScoreBadgeClass(lead.score)}">
                            ${lead.score || 0}
                        </span>
                    </td>
                    <td>${this.formatTime(lead.timestamp)}</td>
                    <td>
                        <span class="badge badge-${this.getUrgencyBadgeClass(lead.urgency)}">
                            ${lead.urgency || 'medium'}
                        </span>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Failed to load recent leads:', error);
        }
    }

    // Products Section
    async loadProducts() {
        const tbody = document.querySelector('#productsTable tbody');

        if (!this.config || !this.config.products || this.config.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--gray-600);">
                        No products added yet. <a href="#" onclick="dashboard.showAddProductModal()" style="color: var(--primary);">Add your first product</a>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.config.products.map(product => `
            <tr>
                <td>
                    <strong>${product.name}</strong><br>
                    <small>${this.truncateText(product.description || '', 50)}</small>
                </td>
                <td>₱${this.formatNumber(product.price)}</td>
                <td>
                    <span class="badge badge-${this.getStockBadgeClass(product.stock)}">
                        ${product.stock || 0}
                    </span>
                </td>
                <td>${product.category || 'General'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="dashboard.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="dashboard.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showAddProductModal() {
        this.currentEditingProduct = null;
        document.getElementById('addProductForm').reset();
        document.querySelector('#addProductModal .modal-header h3').textContent = 'Add New Product';
        this.showModal('addProductModal');
    }

    async addProduct() {
        const form = document.getElementById('addProductForm');
        const formData = new FormData(form);

        const productData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value) || 0,
            category: document.getElementById('productCategory').value || 'General',
            description: document.getElementById('productDescription').value,
            keywords: document.getElementById('productKeywords').value
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0)
        };

        if (!productData.name || !productData.price) {
            this.showAlert('error', 'Product name and price are required');
            return;
        }

        try {
            if (!this.config.products) {
                this.config.products = [];
            }

            if (this.currentEditingProduct) {
                // Update existing product
                const index = this.config.products.findIndex(p => p.id === this.currentEditingProduct);
                if (index !== -1) {
                    this.config.products[index] = { ...this.config.products[index], ...productData };
                }
            } else {
                // Add new product
                productData.id = 'p' + (this.config.products.length + 1);
                this.config.products.push(productData);
            }

            await this.saveConfiguration();
            this.closeModal('addProductModal');
            this.loadProducts();

            this.showAlert('success', this.currentEditingProduct ? 'Product updated!' : 'Product added!');
        } catch (error) {
            this.showAlert('error', 'Failed to save product');
        }
    }

    editProduct(productId) {
        const product = this.config.products.find(p => p.id === productId);
        if (!product) return;

        this.currentEditingProduct = productId;

        // Fill form with product data
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productKeywords').value = (product.keywords || []).join(', ');

        document.querySelector('#addProductModal .modal-header h3').textContent = 'Edit Product';
        this.showModal('addProductModal');
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            this.config.products = this.config.products.filter(p => p.id !== productId);
            await this.saveConfiguration();
            this.loadProducts();
            this.showAlert('success', 'Product deleted!');
        } catch (error) {
            this.showAlert('error', 'Failed to delete product');
        }
    }

    // Business Information Section
    loadBusinessInfo() {
        if (!this.config) return;

        document.getElementById('shopName').value = this.config.shopName || '';
        document.getElementById('businessType').value = this.config.businessType || 'retail';
        document.getElementById('location').value = this.config.location || '';
        document.getElementById('description').value = this.config.businessInfo?.description || '';
        document.getElementById('businessHours').value = this.config.businessInfo?.businessHours || '';
        document.getElementById('phone').value = this.config.businessInfo?.contactInfo?.phone || '';
        document.getElementById('email').value = this.config.businessInfo?.contactInfo?.email || '';
        document.getElementById('paymentMethods').value = (this.config.businessInfo?.paymentMethods || []).join(', ');
    }

    async saveBusinessInfo() {
        try {
            // Update config with form data
            this.config.shopName = document.getElementById('shopName').value;
            this.config.businessType = document.getElementById('businessType').value;
            this.config.location = document.getElementById('location').value;

            if (!this.config.businessInfo) {
                this.config.businessInfo = {};
            }
            if (!this.config.businessInfo.contactInfo) {
                this.config.businessInfo.contactInfo = {};
            }

            this.config.businessInfo.description = document.getElementById('description').value;
            this.config.businessInfo.businessHours = document.getElementById('businessHours').value;
            this.config.businessInfo.contactInfo.phone = document.getElementById('phone').value;
            this.config.businessInfo.contactInfo.email = document.getElementById('email').value;
            this.config.businessInfo.paymentMethods = document.getElementById('paymentMethods').value
                .split(',')
                .map(method => method.trim())
                .filter(method => method.length > 0);

            await this.saveConfiguration();
            this.showAlert('success', 'Business information saved!');
        } catch (error) {
            this.showAlert('error', 'Failed to save business information');
        }
    }

    // FAQ Section
    loadFAQs() {
        const container = document.getElementById('faqsList');

        if (!this.config || !this.config.faqs || this.config.faqs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 0; color: var(--gray-600);">
                    <i class="fas fa-question-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <h4>No FAQs Added Yet</h4>
                    <p>Add frequently asked questions to help your bot answer common queries.</p>
                    <button class="btn btn-primary" onclick="dashboard.showAddFAQModal()">
                        <i class="fas fa-plus"></i> Add Your First FAQ
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.config.faqs.map(faq => `
            <div class="card" style="margin-bottom: 15px;">
                <div class="card-body">
                    <div style="display: flex; justify-content: between; align-items: start; gap: 15px;">
                        <div style="flex: 1;">
                            <h5 style="color: var(--primary); margin-bottom: 10px;">${faq.question}</h5>
                            <p style="margin-bottom: 10px;">${faq.answer}</p>
                            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                ${(faq.keywords || []).map(keyword =>
                                    `<span class="badge badge-primary">${keyword}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div style="display: flex; gap: 5px; flex-shrink: 0;">
                            <button class="btn btn-outline btn-sm" onclick="dashboard.editFAQ('${faq.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="dashboard.deleteFAQ('${faq.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showAddFAQModal() {
        this.currentEditingFAQ = null;
        document.getElementById('addFAQForm').reset();
        document.querySelector('#addFAQModal .modal-header h3').textContent = 'Add New FAQ';
        this.showModal('addFAQModal');
    }

    async addFAQ() {
        const question = document.getElementById('faqQuestion').value;
        const answer = document.getElementById('faqAnswer').value;
        const keywords = document.getElementById('faqKeywords').value
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        if (!question || !answer) {
            this.showAlert('error', 'Question and answer are required');
            return;
        }

        try {
            if (!this.config.faqs) {
                this.config.faqs = [];
            }

            const faqData = {
                question,
                answer,
                keywords: keywords.length > 0 ? keywords : this.extractKeywords(question + ' ' + answer)
            };

            if (this.currentEditingFAQ) {
                // Update existing FAQ
                const index = this.config.faqs.findIndex(f => f.id === this.currentEditingFAQ);
                if (index !== -1) {
                    this.config.faqs[index] = { ...this.config.faqs[index], ...faqData };
                }
            } else {
                // Add new FAQ
                faqData.id = 'faq' + (this.config.faqs.length + 1);
                this.config.faqs.push(faqData);
            }

            await this.saveConfiguration();
            this.closeModal('addFAQModal');
            this.loadFAQs();

            this.showAlert('success', this.currentEditingFAQ ? 'FAQ updated!' : 'FAQ added!');
        } catch (error) {
            this.showAlert('error', 'Failed to save FAQ');
        }
    }

    editFAQ(faqId) {
        const faq = this.config.faqs.find(f => f.id === faqId);
        if (!faq) return;

        this.currentEditingFAQ = faqId;

        document.getElementById('faqQuestion').value = faq.question;
        document.getElementById('faqAnswer').value = faq.answer;
        document.getElementById('faqKeywords').value = (faq.keywords || []).join(', ');

        document.querySelector('#addFAQModal .modal-header h3').textContent = 'Edit FAQ';
        this.showModal('addFAQModal');
    }

    async deleteFAQ(faqId) {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            this.config.faqs = this.config.faqs.filter(f => f.id !== faqId);
            await this.saveConfiguration();
            this.loadFAQs();
            this.showAlert('success', 'FAQ deleted!');
        } catch (error) {
            this.showAlert('error', 'Failed to delete FAQ');
        }
    }

    // Leads Section
    async loadLeads() {
        try {
            const result = await this.apiCall('/leads');
            this.leads = result.leads || [];
        } catch (error) {
            console.error('Failed to load leads:', error);
            this.leads = [];
        }
    }

    async loadInteractions() {
        try {
            const result = await this.apiCall('/interactions');
            this.interactions = result.interactions || [];
        } catch (error) {
            console.error('Failed to load interactions:', error);
            this.interactions = [];
        }
    }

    loadAllLeads() {
        const tbody = document.querySelector('#leadsTable tbody');

        if (this.leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--gray-600); padding: 50px 0;">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 20px; display: block;"></i>
                        No leads yet. Share your bot link to start getting customers!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.leads.map(lead => `
            <tr>
                <td>${lead.customer || 'Unknown'}</td>
                <td>${this.truncateText(lead.lastMessage || '', 40)}</td>
                <td>${(lead.interestedProducts || []).join(', ') || 'None specified'}</td>
                <td>
                    <span class="badge badge-${this.getScoreBadgeClass(lead.score)}">
                        ${lead.score || 0}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${this.getUrgencyBadgeClass(lead.urgency)}">
                        ${lead.urgency || 'medium'}
                    </span>
                </td>
                <td>${this.formatTime(lead.timestamp)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="dashboard.contactLead('${lead.id}')">
                        <i class="fas fa-phone"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterLeads() {
        const filter = document.getElementById('leadFilter').value;
        // Implement lead filtering logic here
        this.loadAllLeads();
    }

    contactLead(leadId) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;

        // For now, just show an alert with contact info
        // In a real implementation, this might open a messaging interface
        alert(`Contact ${lead.customer}:\nPhone: ${lead.phone || 'Not provided'}\nEmail: ${lead.email || 'Not provided'}`);
    }

    exportLeads() {
        if (this.leads.length === 0) {
            this.showAlert('warning', 'No leads to export');
            return;
        }

        const csv = this.convertToCSV(this.leads);
        this.downloadCSV(csv, 'leads.csv');
        this.showAlert('success', 'Leads exported successfully!');
    }

    // Settings Section
    loadSettings() {
        // Load current Facebook configuration if available
        // This is a placeholder - in a real app, you might want to show masked tokens
    }

    async saveFacebookConfig() {
        const pageAccessToken = document.getElementById('facebookToken').value;
        const verifyToken = document.getElementById('verifyToken').value;

        if (!pageAccessToken || !verifyToken) {
            this.showAlert('error', 'Both tokens are required');
            return;
        }

        try {
            await this.apiCall('/config/facebook', 'POST', {
                page_access_token: pageAccessToken,
                verify_token: verifyToken,
                shop_name: this.config?.shopName
            });

            this.showAlert('success', 'Facebook configuration saved! Your bot is now ready.');

            // Clear the form for security
            document.getElementById('facebookToken').value = '';
            document.getElementById('verifyToken').value = '';
        } catch (error) {
            this.showAlert('error', 'Failed to save Facebook configuration');
        }
    }

    // Bot Testing
    showTestBotModal() {
        document.getElementById('chatMessages').innerHTML = `
            <div style="text-align: center; color: var(--gray-600); padding: 50px 0;">
                Start a conversation to test your bot...
            </div>
        `;
        this.showModal('testBotModal');
    }

    async sendTestMessage() {
        const messageInput = document.getElementById('testMessage');
        const message = messageInput.value.trim();

        if (!message) return;

        const chatContainer = document.getElementById('chatMessages');

        // Add user message
        this.addChatMessage('user', message);
        messageInput.value = '';

        try {
            // Send message to bot
            const result = await this.apiCall('/test/message', 'POST', {
                message: message,
                userName: 'Dashboard User'
            });

            // Add bot response
            this.addChatMessage('bot', result.response);

            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;

        } catch (error) {
            this.addChatMessage('bot', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addChatMessage(sender, message) {
        const chatContainer = document.getElementById('chatMessages');

        if (chatContainer.innerHTML.includes('Start a conversation')) {
            chatContainer.innerHTML = '';
        }

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 15px;
            display: flex;
            ${sender === 'user' ? 'justify-content: flex-end' : 'justify-content: flex-start'};
        `;

        const messageBubble = document.createElement('div');
        messageBubble.style.cssText = `
            max-width: 70%;
            padding: 10px 15px;
            border-radius: 18px;
            ${sender === 'user'
                ? 'background: var(--primary); color: white; border-bottom-right-radius: 5px;'
                : 'background: var(--gray-200); color: var(--dark); border-bottom-left-radius: 5px;'
            }
        `;
        messageBubble.textContent = message;

        messageDiv.appendChild(messageBubble);
        chatContainer.appendChild(messageDiv);
    }

    // Import/Export Functions
    exportConfig() {
        if (!this.config) {
            this.showAlert('error', 'No configuration to export');
            return;
        }

        const configJson = JSON.stringify(this.config, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `fb-messenger-agent-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showAlert('success', 'Configuration exported successfully!');
    }

    importConfig() {
        const fileInput = document.getElementById('configImport');
        const file = fileInput.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedConfig = JSON.parse(e.target.result);
                this.config = importedConfig;

                await this.saveConfiguration();
                this.showAlert('success', 'Configuration imported successfully!');

                // Refresh current section
                const activeSection = document.querySelector('.content-section.active');
                if (activeSection) {
                    this.loadSectionData(activeSection.id);
                }

                fileInput.value = '';
            } catch (error) {
                this.showAlert('error', 'Invalid configuration file');
            }
        };
        reader.readAsText(file);
    }

    async resetToDemo() {
        if (!confirm('This will replace your current configuration with demo data. Continue?')) return;

        try {
            // Reset to demo configuration via API
            const result = await this.apiCall('/config/business', 'POST', {
                basicInfo: {
                    shopName: 'TechHub Philippines',
                    businessType: 'retail',
                    location: 'Quezon City',
                    description: 'We sell the latest gadgets and tech accessories at unbeatable prices'
                },
                products: [
                    {
                        name: 'iPhone 15 Pro',
                        price: 65000,
                        description: 'Latest iPhone with pro camera system',
                        category: 'Smartphones',
                        stock: 25,
                        keywords: ['iphone', 'apple', 'smartphone']
                    },
                    {
                        name: 'AirPods Pro 2',
                        price: 12000,
                        description: 'Premium wireless earbuds',
                        category: 'Audio',
                        stock: 50,
                        keywords: ['airpods', 'wireless', 'earbuds']
                    }
                ],
                faqs: [
                    {
                        question: 'Do you offer installment?',
                        answer: 'Yes! We offer 0% installment plans for 6-12 months.',
                        keywords: ['installment', 'payment', 'monthly']
                    }
                ]
            });

            await this.loadConfiguration();
            this.showAlert('success', 'Demo configuration loaded!');

            // Refresh current section
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                this.loadSectionData(activeSection.id);
            }
        } catch (error) {
            this.showAlert('error', 'Failed to load demo configuration');
        }
    }

    // Utility Functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        });
    }

    showAlert(type, message) {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'error' : type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-PH').format(number);
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getScoreBadgeClass(score) {
        if (score >= 20) return 'success';
        if (score >= 10) return 'warning';
        return 'primary';
    }

    getUrgencyBadgeClass(urgency) {
        switch(urgency) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            default: return 'primary';
        }
    }

    getStockBadgeClass(stock) {
        if (stock === 0) return 'danger';
        if (stock < 10) return 'warning';
        return 'success';
    }

    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3)
            .filter(word => !['this', 'that', 'with', 'have', 'from', 'they', 'been'].includes(word));
        return [...new Set(words)];
    }

    convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ].join('\n');

        return csvContent;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global functions for HTML onclick handlers
let dashboard;

function showSection(sectionId) {
    dashboard.showSection(sectionId);
}

function showAddProductModal() {
    dashboard.showAddProductModal();
}

function addProduct() {
    dashboard.addProduct();
}

function showAddFAQModal() {
    dashboard.showAddFAQModal();
}

function addFAQ() {
    dashboard.addFAQ();
}

function saveBusinessInfo() {
    dashboard.saveBusinessInfo();
}

function saveFacebookConfig() {
    dashboard.saveFacebookConfig();
}

function testBot() {
    dashboard.showTestBotModal();
}

function sendTestMessage() {
    dashboard.sendTestMessage();
}

function exportConfig() {
    dashboard.exportConfig();
}

function importConfig() {
    dashboard.importConfig();
}

function resetToDemo() {
    dashboard.resetToDemo();
}

function filterLeads() {
    dashboard.filterLeads();
}

function exportLeads() {
    dashboard.exportLeads();
}

function closeModal(modalId) {
    dashboard.closeModal(modalId);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new SellerDashboard();
    console.log('✅ Seller Dashboard initialized successfully!');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);