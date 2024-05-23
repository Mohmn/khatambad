function getSellerTableQuery() {
    return `
        CREATE TABLE IF NOT EXISTS Seller (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(300) UNIQUE NOT NULL,
            selling_license_key VARCHAR(255) UNIQUE NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `;
}

function getCustomerTableQuery() {
    return `
        CREATE TABLE IF NOT EXISTS Customer (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(300) UNIQUE NOT NULL,
            shipping_address VARCHAR(1000) NOT NULL,
            pincode VARCHAR(20) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `;
}

function getProductsTableQuery() {
    return `
        CREATE TABLE IF NOT EXISTS Product (
            id SERIAL PRIMARY KEY,
            description VARCHAR(1000) NOT NULL,
            image_urls VARCHAR(255)[] NOT NULL,
            quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `;
}

function getSellerProductTableQuery() {
    return `
        CREATE TABLE IF NOT EXISTS SellerProduct (
            id SERIAL PRIMARY KEY,
            seller_id INTEGER REFERENCES Seller(id) ON DELETE CASCADE NOT NULL,
            product_id INTEGER REFERENCES Product(id) ON DELETE CASCADE NOT NULL,
            price NUMERIC(50, 4) NOT NULL CHECK (price >= 0),
            discount NUMERIC(5, 4) NOT NULL DEFAULT 0 CHECK (discount >= 0),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            UNIQUE (seller_id, product_id)
        );
    `;
}

function getCartTableQuery() {
    return `
        CREATE TABLE IF NOT EXISTS Cart (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES Customer(id) ON DELETE CASCADE NOT NULL,
            product_id INTEGER REFERENCES Product(id) ON DELETE CASCADE NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
            price NUMERIC(50, 4) NOT NULL CHECK (price >= 0),
            discount NUMERIC(5, 4) NOT NULL DEFAULT 0 CHECK (discount >= 0),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            UNIQUE (customer_id, product_id)
        );
    `;
}

function getOrderTableQuery() {
    return `
        CREATE TABLE IF NOT EXISTS Order (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES Customer(id) NOT NULL,
            seller_product_id INTEGER REFERENCES SellerProduct(id) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
            amount NUMERIC(10, 4) NOT NULL CHECK (amount >= 0),
            status VARCHAR(50) DEFAULT 'pending' NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `;
}


export {
    getCartTableQuery,
    getOrderTableQuery,
    getProductsTableQuery,
    getSellerProductTableQuery,
    getSellerTableQuery,
    getCustomerTableQuery,
}