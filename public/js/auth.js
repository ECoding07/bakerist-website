// Authentication functionality for BAKERIST

document.addEventListener('DOMContentLoaded', function() {
    setupAuthForms();
});

// Setup authentication forms
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
        const response = await fetch('/.netlify/functions/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('bakerist_token', data.token);
            Bakerist.showMessage('Login successful!', 'success');
            
            // Close modal and reload page
            document.getElementById('auth-modal').style.display = 'none';
            setTimeout(() => location.reload(), 1000);
        } else {
            Bakerist.showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        Bakerist.showMessage('Login failed. Please try again.', 'error');
    }
}

// Handle user registration
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const contactNo = form.querySelectorAll('input[type="text"]')[1].value;
    const barangay = document.getElementById('barangay').value;
    const sitio = form.querySelectorAll('input[type="text"]')[2].value;
    
    // Basic validation
    if (!name || !email || !password || !contactNo || !barangay || !sitio) {
        Bakerist.showMessage('Please fill all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/.netlify/functions/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                contact_no: contactNo,
                barangay,
                sitio
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Bakerist.showMessage('Registration successful! Please login.', 'success');
            
            // Switch to login tab
            const loginTab = document.querySelector('[data-tab="login"]');
            if (loginTab) {
                loginTab.click();
            }
            
            // Clear form
            form.reset();
        } else {
            Bakerist.showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        Bakerist.showMessage('Registration failed. Please try again.', 'error');
    }
}