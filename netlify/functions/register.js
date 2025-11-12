const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        const { name, email, password, contact_no, barangay, sitio } = JSON.parse(event.body);

        // Validate required fields
        if (!name || !email || !password || !contact_no || !barangay || !sitio) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'All fields are required' 
                })
            };
        }

        // Check if user already exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length > 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'User already exists with this email' 
                })
            };
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, contact_no, barangay, sitio, role) 
             VALUES ($1, $2, $3, $4, $5, $6, 'customer') 
             RETURNING id, name, email, role`,
            [name, email, passwordHash, contact_no, barangay, sitio]
        );

        return {
            statusCode: 201,
            body: JSON.stringify({ 
                success: true, 
                message: 'User registered successfully',
                user: result.rows[0]
            })
        };

    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error' 
            })
        };
    }
};