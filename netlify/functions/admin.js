const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Admin login
exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
            },
            body: ''
        };
    }

    // Admin login
    if (event.httpMethod === 'POST' && event.path.endsWith('/admin_login')) {
        try {
            const { email, password } = JSON.parse(event.body);

            if (!email || !password) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Email and password are required' 
                    })
                };
            }

            // Find admin user
            const result = await pool.query(
                'SELECT id, name, email, password_hash, role FROM users WHERE email = $1 AND role = $2',
                [email, 'admin']
            );

            if (result.rows.length === 0) {
                return {
                    statusCode: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Invalid admin credentials' 
                    })
                };
            }

            const admin = result.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, admin.password_hash);

            if (!isValidPassword) {
                return {
                    statusCode: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Invalid admin credentials' 
                    })
                };
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: admin.id, 
                    email: admin.email, 
                    role: admin.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // Remove password hash from response
            const { password_hash, ...adminWithoutPassword } = admin;

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Admin login successful',
                    token,
                    admin: adminWithoutPassword
                })
            };

        } catch (error) {
            console.error('Admin login error:', error);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Internal server error' 
                })
            };
        }
    }

    // Verify admin token
    if (event.httpMethod === 'GET' && event.path.endsWith('/admin_verify')) {
        try {
            const token = event.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return {
                    statusCode: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'No token provided' 
                    })
                };
            }

            const decoded = verifyToken(token);

            if (decoded.role !== 'admin') {
                return {
                    statusCode: 403,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Admin access required' 
                    })
                };
            }

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    user: decoded 
                })
            };

        } catch (error) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid token' 
                })
            };
        }
    }

    // Get all orders (admin)
    if (event.httpMethod === 'GET' && event.path.endsWith('/admin_orders')) {
        try {
            const token = event.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return {
                    statusCode: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'No token provided' 
                    })
                };
            }

            const decoded = verifyToken(token);

            if (decoded.role !== 'admin') {
                return {
                    statusCode: 403,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Admin access required' 
                    })
                };
            }

            const result = await pool.query(
                `SELECT o.*, u.name as user_name 
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 ORDER BY o.created_at DESC`
            );

            const orders = result.rows.map(order => ({
                ...order,
                items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
                delivery_info: typeof order.delivery_info === 'string' ? JSON.parse(order.delivery_info) : order.delivery_info
            }));

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    orders 
                })
            };

        } catch (error) {
            console.error('Get admin orders error:', error);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Internal server error' 
                })
            };
        }
    }

    // Get all products (admin)
    if (event.httpMethod === 'GET' && event.path.endsWith('/admin_products')) {
        try {
            const token = event.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return {
                    statusCode: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'No token provided' 
                    })
                };
            }

            const decoded = verifyToken(token);

            if (decoded.role !== 'admin') {
                return {
                    statusCode: 403,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Admin access required' 
                    })
                };
            }

            const result = await pool.query(
                'SELECT * FROM products ORDER BY category, name'
            );

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    products: result.rows 
                })
            };

        } catch (error) {
            console.error('Get admin products error:', error);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Internal server error' 
                })
            };
        }
    }

    // Get all customers (admin)
    if (event.httpMethod === 'GET' && event.path.endsWith('/admin_customers')) {
        try {
            const token = event.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return {
                    statusCode: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'No token provided' 
                    })
                };
            }

            const decoded = verifyToken(token);

            if (decoded.role !== 'admin') {
                return {
                    statusCode: 403,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Admin access required' 
                    })
                };
            }

            const result = await pool.query(
                'SELECT id, name, email, contact_no, barangay, sitio, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
                ['customer']
            );

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    customers: result.rows 
                })
            };

        } catch (error) {
            console.error('Get admin customers error:', error);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Internal server error' 
                })
            };
        }
    }

    return {
        statusCode: 404,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Endpoint not found' })
    };
};