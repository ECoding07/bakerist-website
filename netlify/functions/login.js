const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Email and password are required' 
                })
            };
        }

        // Find user by email
        const result = await pool.query(
            'SELECT id, name, email, password_hash, role, barangay, sitio, contact_no FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid email or password' 
                })
            };
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid email or password' 
                })
            };
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Login successful',
                token,
                user: userWithoutPassword
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error' 
            })
        };
    }
};