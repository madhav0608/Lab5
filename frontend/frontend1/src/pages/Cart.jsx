import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/Cart.css";

const Cart = () => {
  // TODO: Implement the checkStatus function
  // If the user is already logged in, fetch the cart.
  // If not, redirect to the login page.

  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status === 200) {
          fetchCart(); // Fetch cart if the user is logged in
        } else {
          navigate("/login"); // Redirect to login if not authenticated
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login");
      }
    };

    checkStatus();
  }, [navigate]);


  // TODO: Manage cart state with useState
  // cart: Stores the items in the cart
  // totalPrice: Stores the total price of all cart items
  // error: Stores any error messages (if any)
  // message: Stores success or info messages
  

  // TODO: Implement the fetchCart function
  // This function should fetch the user's cart data and update the state variables
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Fetch the user's cart data and update the state
  const fetchCart = async () => {
    try {
      const res = await fetch(`${apiUrl}/display-cart`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.status === 200) {
        if (data.cart.length === 0) {
          setMessage("No items in cart.");
        } else {
          setCart(data.cart.sort((a, b) => a.product_id - b.product_id)); // Sort by product_id
          setTotalPrice(data.totalPrice);
          setMessage("Cart fetched successfully.");
        }
      } else {
        setError(data.message || "Error fetching cart.");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError("Error fetching cart.");
    }
  };

  // TODO: Implement the updateQuantity function
  // This function should handle increasing or decreasing item quantities
  // based on user input. Make sure it doesn't exceed stock limits.
  const updateQuantity = async (productId, change, currentQuantity, stockQuantity) => {
    // Calculate the new quantity based on user input
    const newQuantity = currentQuantity + change;
  
    // Ensure the new quantity is within the bounds (0 to stockQuantity)
    if (newQuantity < 0) {
      setError("Quantity cannot be less than 0.");
      return;
    } else if (newQuantity > stockQuantity) {
      setError("Quantity exceeds available stock.");
      return;
    }
  
    
    // Send the update to the server (via API) to update the cart
    try {
      const res = await fetch(`${apiUrl}/update-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity,
        }),
      });
  
      const data = await res.json();
  
      if (res.status === 200) {
        // Update the cart state if successful
        setCart((prevCart) => {
          // Update the quantity of the specific product
          const updatedCart = prevCart.map((item) =>
            item.product_id === productId
              ? { ...item, quantity: newQuantity }
              : item
          );
  
          // Recalculate the total price
          const updatedTotalPrice = updatedCart.reduce(
            (total, item) => total + item.quantity * item.unit_price,
            0
          );
          setTotalPrice(updatedTotalPrice);
  
          return updatedCart;
        });
        setMessage(data.message || "Cart updated successfully.");
      } else {
        setError(data.message || "Error updating cart.");
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      setError("Error updating cart.");
    }
  };
  

  // TODO: Implement the removeFromCart function
  // This function should remove an item from the cart when the "Remove" button is clicked
  const removeFromCart = async (productId) => {
    // Send a request to the backend to remove the item from the cart
    try {
      const res = await fetch(`${apiUrl}/remove-from-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
      });

      const data = await res.json();

      if (res.status === 200) {
        // If successful, remove the item from the cart in the state
        setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
        
        // Update total price
        const removedItem = cart.find(item => item.product_id === productId);
        setTotalPrice(prevTotalPrice => prevTotalPrice - removedItem.quantity * removedItem.price);
        
        setMessage(data.message || "Item removed from cart successfully.");
      } else {
        setError(data.message || "Error removing item from cart.");
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      setError("Error removing item from cart.");
    }
  };


  const generateOrderId = () => {
    const timestamp = Date.now();  // Get current timestamp (milliseconds)
    const randomNumber = Math.floor(Math.random() * 1000);  // Generate a random 3-digit number
    return `ORD-${timestamp}-${randomNumber}`;
  };
  

  // TODO: Implement the handleCheckout function
  // This function should handle the checkout process and validate the address fields
  // If the user is ready to checkout, place the order and navigate to order confirmation
  const handleCheckout = async () => {
    // Validate the address fields
    if (!address.street || !address.city || !address.state || !address.pincode) {
      setError("All address fields must be filled.");
      return;
    }
  
    // Validate pincode using the postal API
    if (!/^\d{6}$/.test(address.pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }
  
    // Prepare the order address data
    const orderData = {
      order_id: generateOrderId(),  // You may want to generate or fetch order ID
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };
  
    try {
      // Place the order by sending request to the /place-order endpoint
      const res = await fetch(`${apiUrl}/place-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
  
      const data = await res.json();
  
      if (res.status === 200) {
        // If the order is successfully placed
        setMessage("Order placed successfully.");
        setCart([]);  // Clear the cart state
        setTotalPrice(0);  // Reset total price
        navigate("/order-confirmation");  // Navigate to order confirmation page
      } else {
        setError(data.message || "Error placing the order.");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setError("Error placing the order.");
    }
  };
  

  // TODO: Implement the handlePinCodeChange function
  // This function should fetch the city and state based on pincode entered by the user
  const handlePinCodeChange = async (e) => {
    const pincode = e.target.value;
  
    // Validate pincode length
    if (pincode.length === 6) {
      try {
        // Fetch data from the postal API
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
  
        if (data[0].Status === "Success") {
          // Use the first result to get city and state
          const { Name: city, State: state } = data[0].PostOffice[0];
  
          // Update city and state fields
          setAddress((prevAddress) => ({
            ...prevAddress,
            city: city,
            state: state,
          }));
        } else {
          // Handle case where no data is found or pincode is invalid
          setError("Invalid pincode or no data found for the given pincode.");
        }
      } catch (error) {
        console.error("Error fetching pincode data:", error);
        setError("Error fetching city and state. Please try again.");
      }
    }
  };
  

  // TODO: Display error messages if any error occurs
  if (error) {
    return <div className="cart-error">{error}</div>;
  }

  return (
    <>
      <div className="cart-container">
        <h1>Your Cart</h1>

        {/* Display the success or info message */}
        {message && <div className="cart-message">{message}</div>}

        {/* Display cart items or empty cart message */}
        {cart.length === 0 ? (
          <p className="empty-cart-message">Your cart is empty</p>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock Available</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Render cart items dynamically */}
                {cart.map((item) => (
                  <tr key={item.item_id}>
                    <td>{item.product_name}</td>
                    <td>${item.unit_price}</td>
                    <td>{item.stock}</td>
                    <td>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, -1, item.quantity, item.stock)
                        }
                      >
                        -
                      </button>
                      {item.quantity}
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, 1, item.quantity, item.stock)
                        }
                      >
                        +
                      </button>
                    </td>
                    <td>${item.total_item_price}</td>
                    <td>
                      <button onClick={() => removeFromCart(item.product_id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Address form */}
            <form>
              <label>Street</label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                required
              />
              <label>City</label>
              <input type="text" value={address.city} disabled />
              <label>State</label>
              <input type="text" value={address.state} disabled />
              <label>Pincode</label>
              <input
                type="text"
                value={address.pincode}
                onChange={handlePinCodeChange}
                required
              />
            </form>

            {/* Total price and checkout button */}
            <div className="cart-total">
              <h3>Total: ${totalPrice}</h3>
              <button onClick={handleCheckout} disabled={cart.length === 0}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Cart;