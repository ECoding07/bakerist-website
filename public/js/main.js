// Main JavaScript file for BAKERIST website
// Handles common functionality across all pages

// Global variables
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('bakerist_cart')) || [];
let products = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    updateCartCount();
    loadBarangays();
    setupEventListeners();
    checkAuthStatus();
    
    // Load products if on menu page or home page
    if (window.location.pathname.includes('menu.html') || 
        window.location.pathname.includes('index.html')) {
        loadProducts();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auth modal
    const authLink = document.getElementById('auth-link');
    const authModal = document.getElementById('auth-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    if (authLink) {
        authLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthModal();
        });
    }
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(this, tabName);
        });
    });
    
    // Cart icon
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            showCartModal();
        });
    }
}

// Load barangays for registration form
async function loadBarangays() {
    const barangaySelect = document.getElementById('barangay');
    if (!barangaySelect) return;
    
    try {
        const response = await fetch('/.netlify/functions/delivery_zones');
        const data = await response.json();
        
        if (data.success) {
            barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
            data.barangays.forEach(barangay => {
                const option = document.createElement('option');
                option.value = barangay.barangay;
                option.textContent = `${barangay.barangay} (₱${barangay.shipping_fee})`;
                barangaySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading barangays:', error);
    }
}

// In loadProducts function (around line 105)
async function loadProducts() {
    try {
        console.log('Loading products from API...');
        const response = await fetch('/.netlify/functions/product');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products API response:', data);
        
        if (data.success) {
            products = data.products;
            console.log(`Loaded ${products.length} products`);
            displayProducts(products);
            
            if (window.location.pathname.includes('index.html')) {
                displayFeaturedProducts(products);
            }
        } else {
            console.error('Products API returned error:', data.message);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Show user-friendly error message
        Bakerist.showMessage('Failed to load products. Please try again.', 'error');
    }
}

// Display products in grid
function displayProducts(productsToDisplay) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    productsToDisplay.forEach(product => {
        if (product.available) {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        }
    });
}

// Display featured products on home page
function displayFeaturedProducts(products) {
    const featuredGrid = document.getElementById('featured-products');
    if (!featuredGrid) return;
    
    // Get 6 random featured products
    const featuredProducts = products
        .filter(p => p.available)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
    
    featuredGrid.innerHTML = '';
    
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredGrid.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">
            ${product.name}
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-description">${product.description || 'Delicious bakery item'}</p>
            <p class="product-price">₱${product.price.toFixed(2)}</p>
            <div class="product-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn minus" data-id="${product.id}">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" data-id="${product.id}">
                    <button class="quantity-btn plus" data-id="${product.id}">+</button>
                </div>
                <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const minusBtn = card.querySelector('.minus');
    const plusBtn = card.querySelector('.plus');
    const quantityInput = card.querySelector('.quantity-input');
    const addToCartBtn = card.querySelector('.add-to-cart');
    
    minusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });
    
    plusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        quantityInput.value = currentValue + 1;
    });
    
    addToCartBtn.addEventListener('click', function() {
        const quantity = parseInt(quantityInput.value);
        addToCart(product.id, quantity);
    });
    
    return card;
}

// Add item to cart
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: product.category
        });
    }
    
    saveCart();
    updateCartCount();
    showMessage('Product added to cart!', 'success');
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    if (document.getElementById('cart-modal').style.display === 'block') {
        showCartModal();
    }
}

// Update cart quantity
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart();
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('bakerist_cart', JSON.stringify(cart));
}

// Update cart count in navigation
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Show cart modal
function showCartModal() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total-amount');
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0.00';
    } else {
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₱${item.price.toFixed(2)} × ${item.quantity}</p>
                    <p class="item-total">₱${itemTotal.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="btn btn-secondary remove-item" data-id="${item.id}">Remove</button>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        cartTotal.textContent = total.toFixed(2);
        
        // Add event listeners for cart items
        const minusBtns = cartItems.querySelectorAll('.minus');
        const plusBtns = cartItems.querySelectorAll('.plus');
        const quantityInputs = cartItems.querySelectorAll('.quantity-input');
        const removeBtns = cartItems.querySelectorAll('.remove-item');
        
        minusBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const input = this.nextElementSibling;
                const currentValue = parseInt(input.value);
                if (currentValue > 1) {
                    input.value = currentValue - 1;
                    updateCartQuantity(productId, currentValue - 1);
                    showCartModal();
                }
            });
        });
        
        plusBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const input = this.previousElementSibling;
                const currentValue = parseInt(input.value);
                input.value = currentValue + 1;
                updateCartQuantity(productId, currentValue + 1);
                showCartModal();
            });
        });
        
        quantityInputs.forEach(input => {
            input.addEventListener('change', function() {
                const productId = this.getAttribute('data-id');
                const quantity = parseInt(this.value);
                if (quantity > 0) {
                    updateCartQuantity(productId, quantity);
                    showCartModal();
                }
            });
        });
        
        removeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                removeFromCart(productId);
            });
        });
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        checkoutBtn.onclick = function() {
            if (currentUser) {
                window.location.href = 'checkout.html';
            } else {
                modal.style.display = 'none';
                showAuthModal();
            }
        };
    }
    
    modal.style.display = 'block';
}

// Show auth modal
function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'block';
}

// Switch between tabs
function switchTab(button, tabName) {
    // Remove active class from all tabs and content
    const tabButtons = button.parentElement.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const tabContents = button.closest('.modal-content').querySelectorAll('.auth-form, .admin-tab-content');
    tabContents.forEach(content => content.classList.add('hidden'));
    
    // Add active class to current tab
    button.classList.add('active');
    
    // Show current tab content
    const currentTab = document.getElementById(`${tabName}-form`) || document.getElementById(`${tabName}-tab`);
    if (currentTab) {
        currentTab.classList.remove('hidden');
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('bakerist_token');
    if (token) {
        // Verify token with server
        verifyToken(token);
    }
}

// Verify JWT token
async function verifyToken(token) {
    try {
        const response = await fetch('/.netlify/functions/verify_token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI();
        } else {
            localStorage.removeItem('bakerist_token');
        }
    } catch (error) {
        console.error('Token verification failed:', error);
    }
}

// Update UI based on authentication status
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (authLink && currentUser) {
        authLink.textContent = `Hello, ${currentUser.name.split(' ')[0]}`;
        authLink.href = '#';
        authLink.onclick = function(e) {
            e.preventDefault();
            // Show user profile or logout
            if (confirm('Do you want to logout?')) {
                logout();
            }
        };
    }
}

// Logout function
function logout() {
    localStorage.removeItem('bakerist_token');
    currentUser = null;
    location.reload();
}

// Show message to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Add to page
    document.body.prepend(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

// Export for use in other files
window.Bakerist = {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    showMessage,
    formatCurrency,
    currentUser: () => currentUser,
    cart: () => cart
};