const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        const { category, search } = event.queryStringParameters || {};

        let query = 'SELECT * FROM products WHERE available = true';
        let params = [];

        if (category && category !== 'all') {
            query += ' AND category = $1';
            params.push(category);
        }

        if (search) {
            query += params.length > 0 ? ' AND name ILIKE $2' : ' AND name ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name';

        console.log('Executing query:', query, 'with params:', params);
        
        const result = await pool.query(query, params);

        console.log(`Found ${result.rows.length} products`);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: true, 
                products: result.rows 
            })
        };

    } catch (error) {
        console.error('Products error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};