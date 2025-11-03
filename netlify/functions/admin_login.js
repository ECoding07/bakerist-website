const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
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

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

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

        const token = jwt.sign(
            { 
                userId: admin.id, 
                email: admin.email, 
                role: admin.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

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
};