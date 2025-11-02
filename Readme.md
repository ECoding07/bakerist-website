# BAKERIST - Mabini Bakery

A complete food ordering website for a Filipino bakery in Mabini, Batangas.

## Features

- **User Authentication**: Register and login system
- **Product Catalog**: Browse bakery items by category
- **Shopping Cart**: Add items and manage quantities
- **Order System**: Complete ordering process with delivery
- **Order Tracking**: Real-time order status tracking
- **Admin Panel**: Manage products, orders, and customers
- **Responsive Design**: Works on all device sizes

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Netlify Functions (Node.js)
- **Database**: Neon Postgres (PostgreSQL)
- **Deployment**: Netlify

## Setup Instructions

### 1. Database Setup (Neon Postgres)

1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project and database
3. Copy your database connection string
4. Run the schema and seed scripts from the `/db` folder

### 2. Local Development

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli