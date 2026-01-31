# Shopping Cart API

This is a robust backend for a shopping cart application built with NestJS, TypeORM, PostgreSQL, and Redis. It features a full-featured, cookie-based cart system, product management, and an order processing workflow.

## Features

- **Product Management**: CRUD operations for products.
- **Shopping Cart**: Add/remove items, view cart, and checkout.
- **Cookie-Based Sessions**: Persistent cart sessions for users.
- **Transactional Integrity**: Ensures atomic operations for critical actions like checkout and stock management.
- **Race Condition Prevention**: Uses Redis distributed locks to prevent stock issues during concurrent requests.
- **Automated Cleanup**: A scheduled job cleans up abandoned carts and returns items to stock.
- **Containerized Environment**: Comes with a Docker Compose setup for easy development and deployment.

## Prerequisites

- Docker and Docker Compose

## Running the Application with Docker

The entire development environment is containerized using Docker Compose. This includes the NestJS application, a PostgreSQL database, and a Redis instance.

1.  **Clone the repository**

2.  **Build and run the containers:**

    ```bash
    docker-compose up --build
    ```

    This command will:
    - Build the Docker image for the NestJS application.
    - Start the PostgreSQL and Redis services.
    - Automatically run database migrations to set up the required tables.
    - Start the backend application, which will be accessible at `http://localhost:3000`.

## API Endpoints

You can interact with the API using any HTTP client, such as `curl` or Postman.

### Products

-   **Get all products**

    ```bash
    curl -X GET http://localhost:3000/products
    ```

-   **Create a new product**

    ```bash
    curl -X POST http://localhost:3000/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Laptop",
      "description": "A powerful new laptop",
      "price": 1200,
      "stock": 50
    }'
    ```

### Shopping Cart

The cart is managed via a `cartId` cookie that is automatically set on the first request to add an item. All subsequent requests to the cart endpoints must include this cookie. `curl` handles this automatically if you use a cookie jar (`-c` and `-b` flags).

1.  **Add an item to the cart (first time)**

    This request will create a new cart and return a `Set-Cookie` header.

    ```bash
    # Replace <PRODUCT_ID> with a valid product ID
    curl -X POST http://localhost:3000/cart/items \
    -H "Content-Type: application/json" \
    -d '{
      "productId": "<PRODUCT_ID>",
      "quantity": 1
    }' \
    -c cookie-jar.txt -v
    ```

2.  **Add another item or view the cart**

    Use the cookie jar from the previous request to maintain the session.

    ```bash
    # Get the current cart
    curl -X GET http://localhost:3000/cart -b cookie-jar.txt

    # Remove an item (replace <ITEM_ID> with a cart item ID)
    curl -X DELETE http://localhost:3000/cart/items/<ITEM_ID> -b cookie-jar.txt
    ```

3.  **Checkout**

    This will convert the cart into an order and clear the cart.

    ```bash
    curl -X POST http://localhost:3000/cart/checkout -b cookie-jar.txt
    ```

