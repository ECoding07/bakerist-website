const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

    // Create new order
    if (event.httpMethod === 'POST') {
        try {
            const { user_id, items, total, delivery_info, payment_method } = JSON.parse(event.body);

            if (!user_id || !items || !total || !delivery_info || !payment_method) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'All fields are required' 
                    })
                };
            }

            // Insert new order
            const result = await pool.query(
                `INSERT INTO orders (user_id, items, total, delivery_info, payment_method, tracking_status) 
                 VALUES ($1, $2, $3, $4, $5, 'to_pay') 
                 RETURNING id, created_at`,
                [user_id, JSON.stringify(items), total, JSON.stringify(delivery_info), payment_method]
            );

            return {
                statusCode: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Order created successfully',
                    order: {
                        id: result.rows[0].id,
                        created_at: result.rows[0].created_at
                    }
                })
            };

        } catch (error) {
            console.error('Create order error:', error);
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

    // Get order by ID (for tracking)
    if (event.httpMethod === 'GET') {
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
                `SELECT o.*, u.name as user_name, u.contact_no, u.barangay, u.sitio 
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
            console.error('Get order error:', error);
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
        statusCode: 405,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Method not allowed' })
    };
};