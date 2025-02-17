const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 4000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: '0608',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Session information
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

/////////////////////////////////////////////////////////////
// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// TODO: Implement authentication middleware
// Redirect unauthenticated users to the login page with respective status code
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    // If a session exists, continue to the next route handler
    return next();
  } else {
    // If no session, respond with a 400 Unauthorized error
    return res.status(400).json({ message: "Unauthorized" });
  }
}

app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});


// TODO: Implement user signup logic
// return JSON object with the following fields: {username, email, password}
// use correct status codes and messages mentioned in the lab document
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if all fields are provided
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Error: Missing required fields" });
  }

  try {
    // Check if the email already exists
    const emailCheckQuery = 'SELECT * FROM users WHERE email = $1';
    const emailCheckResult = await pool.query(emailCheckQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({ message: "Error: Email is already registered." });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3) RETURNING user_id, username, email;
    `;
    const insertResult = await pool.query(insertUserQuery, [username, email, hashedPassword]);

    const newUser = insertResult.rows[0];

    // Store the user_id in the session
    req.session.userId = newUser.user_id;

    // Respond with success message
    return res.status(200).json({ message: "User Registered Successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error signing up" });
  }
});

// TODO: Implement user signup logic
// return JSON object with the following fields: {email, password}
// use correct status codes and messages mentioned in the lab document
// POST route for user login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  try {
    // Check if the email exists in the database
    const checkEmailQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(checkEmailQuery, [email]);

    if (result.rows.length === 0) {
      // If email doesn't exist, return an error message
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // If the password doesn't match, return an error message
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Store the user ID in the session after successful login
    req.session.userId = user.user_id;

    // Respond with a success message
    return res.status(200).json({ message: "Login successful" });

  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Error logging in" });
  }
});

// TODO: Implement API used to check if the client is currently logged in or not.
// use correct status codes and messages mentioned in the lab document
app.get("/isLoggedIn", (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({ message: "User is logged in" });
  }
  return res.status(400).json({ message: "User is not logged in" });
});

// TODO: Implement API used to logout the user
// use correct status codes and messages mentioned in the lab document
// Logout API route
app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      // If there's an error while destroying the session, send a failure response
      return res.status(500).json({ message: "Failed to log out" });
    }

    // If session is destroyed successfully, send a success response
    res.status(200).json({ message: "Logged out successfully" });
  });
});


////////////////////////////////////////////////////
// APIs for the products
// use correct status codes and messages mentioned in the lab document
// TODO: Fetch and display all products from the database
app.get("/list-products", isAuthenticated, async (req, res) => {
  try {
    // Fetch products from the database
    const result = await pool.query("SELECT * FROM Products ORDER BY product_id ASC");

    // If no products found
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Send response with the list of products
    res.status(200).json({
      message: "Products fetched successfully",
      products: result.rows,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Error listing products" });
  }
});

// APIs for cart: add_to_cart, display-cart, remove-from-cart
// TODO: impliment add to cart API which will add the quantity of the product specified by the user to the cart
app.post("/add-to-cart", isAuthenticated, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    // Validate request body
    if (!product_id || quantity <= 0) {
      return res.status(400).json({ message: "Invalid product ID or quantity" });
    }

    // Log session userId for debugging
    console.log("User ID from session:", req.session.userId);

    // Check if the product exists
    const product = await pool.query("SELECT * FROM Products WHERE product_id = $1", [product_id]);
    if (product.rows.length === 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productData = product.rows[0];

    // Check if there is enough stock available
    if (quantity > productData.stock_quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${productData.name}.` });
    }

    // Check if the product is already in the user's cart (using item_id)
    const cartItem = await pool.query(
      "SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2",
      [req.session.userId, product_id]  // Corrected to use item_id in the Cart table
    );

    if (cartItem.rows.length > 0) {
      // Update the existing cart quantity
      const newQuantity = cartItem.rows[0].quantity + quantity;

      // Ensure the new quantity doesn't exceed stock
      if (newQuantity > productData.stock_quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${productData.name}.` });
      }

      await pool.query(
        "UPDATE Cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3",  // Using item_id
        [newQuantity, req.session.userId, product_id]  // Corrected to use item_id in the Cart table
      );
    } else {
      // Add the product to the cart if it doesn't exist
      await pool.query(
        "INSERT INTO Cart (user_id, item_id, quantity) VALUES ($1, $2, $3)",  // Using item_id
        [req.session.userId, product_id, quantity]  // Corrected to use item_id in the Cart table
      );
    }

    // Send success response
    res.status(200).json({ message: `Successfully added ${quantity} of ${productData.name} to your cart.` });

  } catch (error) {
    // Log detailed error message
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart", error: error.message });
  }
});



// API to display items in the cart
app.get("/display-cart", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const cartItems = await pool.query(
      `SELECT Cart.item_id, Products.name AS product_name, Cart.quantity, 
              Products.price AS unit_price, (Cart.quantity * Products.price) AS total_item_price
       FROM Cart
       JOIN Products ON Cart.item_id = Products.product_id
       WHERE Cart.user_id = $1`,
      [userId]
    );

    if (cartItems.rows.length === 0) {
      return res.status(200).json({ message: "No items in cart.", cart: [], totalPrice: 0 });
    }

    const totalPrice = cartItems.rows.reduce((sum, item) => sum + item.total_item_price, 0);

    res.status(200).json({
      message: "Cart fetched successfully.",
      cart: cartItems.rows,
      totalPrice,
    });

  } catch (error) {
    console.error("Error fetching cart ------", error);
    res.status(500).json({ message: "Error fetching cart -----" });
  }
});

// API to remove an item from the cart
app.post("/remove-from-cart", isAuthenticated, async (req, res) => {
  try {
    const { product_id } = req.body;
    const userId = req.session.userId;

    const cartItem = await pool.query(
      "SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2",
      [userId, product_id]
    );

    if (cartItem.rows.length === 0) {
      return res.status(400).json({ message: "Item not present in your cart." });
    }

    await pool.query("DELETE FROM Cart WHERE user_id = $1 AND item_id = $2", [userId, product_id]);

    res.status(200).json({ message: "Item removed from your cart successfully." });

  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Error removing item from cart" });
  }
});

// API to update cart quantity
app.post("/update-cart", isAuthenticated, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const userId = req.session.userId;

    if (!product_id || quantity === 0) {
      return res.status(400).json({ message: "Invalid product ID or quantity" });
    }

    const product = await pool.query("SELECT * FROM Products WHERE product_id = $1", [product_id]);
    if (product.rows.length === 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productData = product.rows[0];
    const cartItem = await pool.query(
      "SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2",
      [userId, product_id]
    );

    if (cartItem.rows.length > 0) {
      const newQuantity = cartItem.rows[0].quantity + quantity;

      if (newQuantity > productData.stock_quantity) {
        return res.status(400).json({ message: `Requested quantity exceeds available stock` });
      }

      if (newQuantity <= 0) {
        await pool.query("DELETE FROM Cart WHERE user_id = $1 AND item_id = $2", [userId, product_id]);
      } else {
        await pool.query(
          "UPDATE Cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3",
          [newQuantity, userId, product_id]
        );
      }
    } else {
      if (quantity > productData.stock_quantity) {
        return res.status(400).json({ message: `Requested quantity exceeds available stock` });
      }

      await pool.query(
        "INSERT INTO Cart (user_id, item_id, quantity) VALUES ($1, $2, $3)",
        [userId, product_id, quantity]
      );
    }

    res.status(200).json({ message: "Cart updated successfully" });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart" });
  }
});

// API to place an order
app.post("/place-order", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const cartItems = await pool.query(
      "SELECT Cart.item_id, Cart.quantity, Products.name, Products.price, Products.stock_quantity FROM Cart JOIN Products ON Cart.item_id = Products.product_id WHERE Cart.user_id = $1",
      [userId]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    for (const item of cartItems.rows) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
    }

    const totalAmount = cartItems.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const orderResult = await pool.query(
      "INSERT INTO Orders (user_id, order_date, total_amount) VALUES ($1, NOW(), $2) RETURNING order_id",
      [userId, totalAmount]
    );
    const orderId = orderResult.rows[0].order_id;

    for (const item of cartItems.rows) {
      await pool.query(
        "INSERT INTO OrderItems (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.product_id, item.quantity, item.price]
      );

      await pool.query(
        "UPDATE Products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2",
        [item.quantity, item.product_id]
      );
    }

    await pool.query("DELETE FROM Cart WHERE user_id = $1", [userId]);

    res.status(200).json({ message: "Order placed successfully" });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Error placing order" });
  }
});

// API to fetch the latest order
app.get("/order-confirmation", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const order = await pool.query(
      "SELECT order_id, user_id, order_date, total_amount FROM Orders WHERE user_id = $1 ORDER BY order_date DESC LIMIT 1",
      [userId]
    );

    if (order.rows.length === 0) {
      return res.status(400).json({ message: "Order not found" });
    }

    const orderId = order.rows[0].order_id;

    const orderItems = await pool.query(
      "SELECT OrderItems.order_id, OrderItems.product_id, OrderItems.quantity, OrderItems.price, Products.name AS product_name FROM OrderItems JOIN Products ON OrderItems.product_id = Products.product_id WHERE OrderItems.order_id = $1",
      [orderId]
    );

    res.status(200).json({
      message: "Order fetched successfully",
      order: order.rows[0],
      orderItems: orderItems.rows,
    });

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error fetching order details" });
  }
});


////////////////////////////////////////////////////
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});