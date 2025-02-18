import React from "react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/OrderConfirmation.css";

const OrderConfirmation = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log("HI ");
        const res = await fetch(`${apiUrl}/isLoggedIn`, {
          method : "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        
        if (res.status === 200) {
          fetchOrderConfirmation();
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login");
      }
    };
    checkStatus();
  }, [navigate]);

  const fetchOrderConfirmation = async () => {
    try {

      console.log("Hello");
      const response = await fetch(`${apiUrl}/order-confirmation`, {
        method : "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.status === 200) {
        setOrderDetails(data);
      } else {
        setError(data.message || "Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to fetch order details");
    }
  };

  

  return (
    <>
      <Navbar />
      <div className="order-confirmation">
        {error && <p className="error">{error}</p>}
        {orderDetails ? (
          <div>
            <h1>Order Confirmation</h1>
            <p>Order ID: {orderDetails.order.order_id}</p>
            <p>Order Date: {orderDetails.order.order_date}</p>
            <p>Total Amount: ${orderDetails.order.total_amount}</p>

            <h2>Items In your order</h2>

            <table>
            <thead>
            <tr>
              <th>Product ID</th>
              <th> Product Name</th>
              <th> Product Quantity</th>
              <th> Price per Item</th>
              <th>Total Price</th>
            </tr>
            </thead>

            <tbody>
            {orderDetails.orderItems.map(
              (item) =>(
                <tr key={item.product_id}>

                  <td> {item.product_id}</td>
                  <td> {item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td> {item.price}</td>
                  <td> {item.price * item.quantity}</td>

                </tr>
              )
            )}

          </tbody>

            </table>
            
  
          </div>
        ) : (
          <p>Loading order details...</p>
        )}

        <button onClick={() => navigate("/dashboard")}> Continue Shopping </button>

      </div>
    </>
  );
};

export default OrderConfirmation;
