const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
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
                'Access-Control-Allow-Methods': 'GET, POST'
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
        const { order_id } = event.queryStringParameters;

        if (!order_id) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Order ID is required' 
                })
            };
        }

        const result = await pool.query(
            `SELECT o.*, u.name as user_name 
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             WHERE o.id = $1`,
            [order_id]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Order not found' 
                })
            };
        }

        const order = result.rows[0];
        
        // Parse JSON fields
        order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        order.delivery_info = typeof order.delivery_info === 'string' ? JSON.parse(order.delivery_info) : order.delivery_info;

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                order 
            })
        };

    } catch (error) {
        console.error('Tracking error:', error);
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