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
        const response = await fetch(`${apiUrl}/check-login-status`, {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok && data.loggedIn) {
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
      const response = await fetch(`${apiUrl}/order-confirmation`, {
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
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
            <p>Order ID: {orderDetails.orderId}</p>
            <p>Order Date: {orderDetails.orderDate}</p>
            <p>Total Amount: ${orderDetails.totalAmount}</p>
            {/* Add more order details as needed */}
          </div>
        ) : (
          <p>Loading order details...</p>
        )}
      </div>
    </>
  );
};

export default OrderConfirmation;
