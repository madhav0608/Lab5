import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Login = () => {
  const navigate = useNavigate(); // Use this to redirect users


  // useEffect checks if the user is already logged in
  // if already loggedIn then it will simply navigate to the dashboard
  // TODO: Implement the checkStatus function.
  useEffect(() => {
    const checkStatus = async () => {
      // Implement your logic here
    };
    checkStatus();
  }, []);

  // Read about useState to manage form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });


const [errorMessage, setErrorMessage] = useState(""); // Initialize with an empty string

// Handle form input changes
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({
    ...formData, 
    [name]: value, 
  });
};

/*
const updatedFormData = { ...formData, email: "new@example.com" };

will come as

const updatedFormData = {
  email: "user@example.com",  // from ...formData
  password: "password123",    // from ...formData
  name: "John Doe",           // from ...formData
  email: "new@example.com"    // from [name]: value (overwrites the previous email)
};
  
*/

// Handle form submission for login
const handleSubmit = async (e) => {
  e.preventDefault();

  // Send the login credentials to the server
  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      credentials: "include", // Ensures cookies are sent with the request
    });

    const data = await response.json();

    if (response.status === 200) {
      // If login is successful, redirect to the dashboard
      navigate("/dashboard");
    } else {
      // Display error message if login failed
      setErrorMessage(data.message || "Login failed. Please try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    setErrorMessage("Error logging in. Please try again later.");
  }
};

return (
  <div>
    <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <button type="submit">Login</button>
    </form>
    <p>
      Don't have an account? <a href="/signup">Sign up here</a>
    </p>
  </div>
);
};

export default Login;