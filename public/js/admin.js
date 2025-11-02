// Admin panel functionality for BAKERIST

let adminToken = null;
let adminOrders = [];
let adminProducts = [];
let adminCustomers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// Initialize admin panel
function initializeAdmin() {
    checkAdminAuth();
    setupAdminEventListeners();
}

// Check if admin is authenticated
function checkAdminAuth() {
    const token = localStorage.getItem('bakerist_admin_token');
    if (token) {
        verifyAdminToken(token);
    } else {
        showAdminLogin();
    }
}

// Verify admin token
async function verifyAdminToken(token) {
    try {
        const response = await fetch('/.netlify/functions/admin_verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            adminToken = token;
            showAdminDashboard();
            loadAdminData();
        } else {
            showAdminLogin();
        }
    } catch (error) {
        console.error('Admin token verification failed:', error);
        showAdminLogin();
    }
}

// Show admin login section
function showAdminLogin() {
    document.getElementById('admin-login-section').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('admin-login-section').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Admin login form
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Admin logout
    const adminLogoutBtn = document.getElementById('admin-logout');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Admin tabs
    const adminTabButtons = document.querySelectorAll('.admin-tabs .tab-button');
    adminTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAdminTab(this, tabName);
        });
    });
    
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            showProductModal();
        });
    }
    
    // Product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Export orders
    const exportOrdersBtn = document.getElementById('export-orders');
    if (exportOrdersBtn) {
        exportOrdersBtn.addEventListener('click', exportOrders);
    }
    
    // Generate report
    const generateReportBtn = document.getElementById('generate-report');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    // Export report
    const exportReportBtn = document.getElementById('export-report');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', exportReport);
    }
    
    // Order status filter
    const orderStatusFilter = document.getElementById('order-status-filter');
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', filterOrders);
    }
}

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const response = await fetch('/.netlify/functions/admin_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('bakerist_admin_token', data.token);
            adminToken = data.token;
            Bakerist.showMessage('Admin login successful!', 'success');
            showAdminDashboard();
            loadAdminData();
        } else {
            Bakerist.showMessage(data.message || 'Admin login failed', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        Bakerist.showMessage('Admin login failed. Please try again.', 'error');
    }
}

// Handle admin logout
function handleAdminLogout() {
    localStorage.removeItem('bakerist_admin_token');
    adminToken = null;
    showAdminLogin();
}

// Switch admin tabs
function switchAdminTab(button, tabName) {
    // Remove active class from all tabs and content
    const tabButtons = button.parentElement.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to current tab
    button.classList.add('active');
    
    // Show current tab content
    const currentTab = document.getElementById(`${tabName}-tab`);
    if (currentTab) {
        currentTab.classList.add('active');
        
        // Load data for the tab if needed
        switch(tabName) {
            case 'orders':
                loadOrders();
                break;
            case 'products':
                loadAdminProducts();
                break;
            case 'customers':
                loadCustomers();
                break;
            case 'reports':
                // Reports will be loaded when generated
                break;
        }
    }
}

// Load admin data
function loadAdminData() {
    loadOrders();
    loadAdminProducts();
    loadCustomers();
}

// Load orders for admin
async function loadOrders() {
    try {
        const response = await fetch('/.netlify/functions/admin_orders', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            adminOrders = data.orders;
            displayOrders(adminOrders);
        } else {
            Bakerist.showMessage('Failed to load orders', 'error');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        Bakerist.showMessage('Error loading orders', 'error');
    }
}

// Display orders in admin panel
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="order-info">
                <h4>Order #${order.id}</h4>
                <p>Customer: ${order.user_name}</p>
                <p>Total: ₱${order.total.toFixed(2)}</p>
                <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div class="order-actions">
                <span class="order-status status-${order.tracking_status}">
                    ${order.tracking_status.replace(/_/g, ' ').toUpperCase()}
                </span>
                <button class="btn btn-primary view-order" data-id="${order.id}">View</button>
                <select class="status-select" data-id="${order.id}">
                    <option value="to_pay" ${order.tracking_status === 'to_pay' ? 'selected' : ''}>To Pay</option>
                    <option value="to_prepare" ${order.tracking_status === 'to_prepare' ? 'selected' : ''}>To Prepare</option>
                    <option value="out_for_delivery" ${order.tracking_status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="delivered" ${order.tracking_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </div>
        `;
        
        ordersList.appendChild(orderItem);
        
        // Add event listeners
        const viewBtn = orderItem.querySelector('.view-order');
        const statusSelect = orderItem.querySelector('.status-select');
        
        viewBtn.addEventListener('click', function() {
            viewOrderDetails(order.id);
        });
        
        statusSelect.addEventListener('change', function() {
            updateOrderStatus(order.id, this.value);
        });
    });
}

// Filter orders by status
function filterOrders() {
    const status = document.getElementById('order-status-filter').value;
    
    if (status === 'all') {
        displayOrders(adminOrders);
    } else {
        const filteredOrders = adminOrders.filter(order => order.tracking_status === status);
        displayOrders(filteredOrders);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch('/.netlify/functions/update_order_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                order_id: orderId,
                status: newStatus
            })
        });
        
        if (response.ok) {
            Bakerist.showMessage('Order status updated!', 'success');
            loadOrders(); // Reload orders to reflect changes
        } else {
            Bakerist.showMessage('Failed to update order status', 'error');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        Bakerist.showMessage('Error updating order status', 'error');
    }
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/.netlify/functions/order_details?order_id=${orderId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showOrderDetailsModal(data.order);
        } else {
            Bakerist.showMessage('Failed to load order details', 'error');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        Bakerist.showMessage('Error loading order details', 'error');
    }
}

// Show order details modal
function showOrderDetailsModal(order) {
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    content.innerHTML = `
        <div class="order-detail">
            <h4>Order Information</h4>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${order.user_name}</p>
            <p><strong>Contact:</strong> ${order.contact_no}</p>
            <p><strong>Address:</strong> ${order.barangay}, ${order.sitio}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method}</p>
            <p><strong>Status:</strong> ${order.tracking_status.replace(/_/g, ' ').toUpperCase()}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div class="order-items">
            <h4>Order Items</h4>
            ${order.items.map(item => `
                <div class="order-item-detail">
                    <p>${item.name} - ₱${item.price.toFixed(2)} × ${item.quantity} = ₱${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            `).join('')}
        </div>
        <div class="order-total">
            <p><strong>Total: ₱${order.total.toFixed(2)}</strong></p>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Load products for admin
async function loadAdminProducts() {
    try {
        const response = await fetch('/.netlify/functions/admin_products', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            adminProducts = data.products;
            displayAdminProducts(adminProducts);
        } else {
            Bakerist.showMessage('Failed to load products', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        Bakerist.showMessage('Error loading products', 'error');
    }
}

// Display products in admin panel
function displayAdminProducts(products) {
    const productsList = document.getElementById('admin-products-list');
    if (!productsList) return;
    
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>Category: ${product.category}</p>
                <p>Price: ₱${product.price.toFixed(2)}</p>
                <p>Stock: ${product.stock}</p>
                <p>Status: ${product.available ? 'Available' : 'Out of Stock'}</p>
            </div>
            <div class="product-actions">
                <button class="btn btn-primary edit-product" data-id="${product.id}">Edit</button>
                <button class="btn btn-secondary toggle-availability" data-id="${product.id}">
                    ${product.available ? 'Disable' : 'Enable'}
                </button>
            </div>
        `;
        
        productsList.appendChild(productItem);
        
        // Add event listeners
        const editBtn = productItem.querySelector('.edit-product');
        const toggleBtn = productItem.querySelector('.toggle-availability');
        
        editBtn.addEventListener('click', function() {
            editProduct(product.id);
        });
        
        toggleBtn.addEventListener('click', function() {
            toggleProductAvailability(product.id, !product.available);
        });
    });
}

// Show product modal for adding/editing
function showProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-options').value = product.options || '';
        document.getElementById('product-available').checked = product.available;
    } else {
        title.textContent = 'Add New Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'block';
}

// Edit product
function editProduct(productId) {
    const product = adminProducts.find(p => p.id === productId);
    if (product) {
        showProductModal(product);
    }
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value;
    const options = document.getElementById('product-options').value;
    const available = document.getElementById('product-available').checked;
    
    const productData = {
        name,
        category,
        price,
        stock,
        description,
        options,
        available
    };
    
    try {
        let response;
        if (productId) {
            // Update existing product
            productData.id = productId;
            response = await fetch('/.netlify/functions/update_product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Add new product
            response = await fetch('/.netlify/functions/add_product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            Bakerist.showMessage(`Product ${productId ? 'updated' : 'added'} successfully!`, 'success');
            document.getElementById('product-modal').style.display = 'none';
            loadAdminProducts();
        } else {
            Bakerist.showMessage(`Failed to ${productId ? 'update' : 'add'} product`, 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        Bakerist.showMessage('Error saving product', 'error');
    }
}

// Toggle product availability
async function toggleProductAvailability(productId, available) {
    try {
        const response = await fetch('/.netlify/functions/toggle_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                product_id: productId,
                available: available
            })
        });
        
        if (response.ok) {
            Bakerist.showMessage('Product availability updated!', 'success');
            loadAdminProducts();
        } else {
            Bakerist.showMessage('Failed to update product availability', 'error');
        }
    } catch (error) {
        console.error('Error updating product availability:', error);
        Bakerist.showMessage('Error updating product availability', 'error');
    }
}

// Load customers
async function loadCustomers() {
    try {
        const response = await fetch('/.netlify/functions/admin_customers', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            adminCustomers = data.customers;
            displayCustomers(adminCustomers);
        } else {
            Bakerist.showMessage('Failed to load customers', 'error');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        Bakerist.showMessage('Error loading customers', 'error');
    }
}

// Display customers
function displayCustomers(customers) {
    const customersList = document.getElementById('customers-list');
    if (!customersList) return;
    
    customersList.innerHTML = '';
    
    customers.forEach(customer => {
        const customerItem = document.createElement('div');
        customerItem.className = 'customer-item';
        customerItem.innerHTML = `
            <div class="customer-info">
                <h4>${customer.name}</h4>
                <p>Email: ${customer.email}</p>
                <p>Contact: ${customer.contact_no}</p>
                <p>Address: ${customer.barangay}, ${customer.sitio}</p>
                <p>Joined: ${new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
        `;
        
        customersList.appendChild(customerItem);
    });
}

// Generate sales report
async function generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    if (!startDate || !endDate) {
        Bakerist.showMessage('Please select both start and end dates', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/.netlify/functions/sales_report?start_date=${startDate}&end_date=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayReportSummary(data.report);
        } else {
            Bakerist.showMessage('Failed to generate report', 'error');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        Bakerist.showMessage('Error generating report', 'error');
    }
}

// Display report summary
function displayReportSummary(report) {
    const reportSummary = document.getElementById('report-summary');
    if (!reportSummary) return;
    
    reportSummary.innerHTML = `
        <div class="report-stats">
            <h4>Sales Report Summary</h4>
            <p><strong>Period:</strong> ${report.start_date} to ${report.end_date}</p>
            <p><strong>Total Orders:</strong> ${report.total_orders}</p>
            <p><strong>Total Revenue:</strong> ₱${report.total_revenue.toFixed(2)}</p>
            <p><strong>Average Order Value:</strong> ₱${report.average_order_value.toFixed(2)}</p>
        </div>
        <div class="report-details">
            <h4>Top Products</h4>
            <ul>
                ${report.top_products.map(product => `
                    <li>${product.name}: ${product.quantity_sold} sold (₱${product.revenue.toFixed(2)})</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Export orders to CSV
function exportOrders() {
    // Simple CSV export implementation
    const headers = ['Order ID', 'Customer', 'Total', 'Status', 'Date'];
    const csvData = adminOrders.map(order => [
        order.id,
        order.user_name,
        order.total,
        order.tracking_status,
        new Date(order.created_at).toLocaleDateString()
    ]);
    
    exportToCSV([headers, ...csvData], 'orders.csv');
}

// Export report to CSV
function exportReport() {
    // This would export the current report data
    Bakerist.showMessage('Export feature coming soon!', 'info');
}

// Utility function to export data to CSV
function exportToCSV(data, filename) {
    const csvContent = data.map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}