import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Dashboard = () => {
  const navigate = useNavigate(); // Use this to redirect users

  const [username, setUsername] = useState("User");

  // TODO: Implement the checkStatus function.
  // This function should check if the user is logged in.
  // If not logged in, redirect to the login page.
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Make an API call to check if the user is logged in
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include", // To ensure the session is included
        });

        if (response.ok) {
          // If logged in, fetch the username and update the state
          const data = await response.json();
          setUsername(data.username); // Assuming the response has a username field
        } else {
          // If not logged in, redirect to the login page
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login");
      }
    };

    checkStatus();
  }, [navigate]);

  return (
    <div>
      <Navbar />
      <h1>Hi {username}!</h1>
      <div>Welcome to the Ecommerce App</div>
    </div>
  );
};

export default Dashboard;
