import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Signup = () => {
  const navigate = useNavigate(); // Use this to redirect users

  // TODO: Implement the checkStatus function.
  // If the user is already logged in, make an API call 
  // to check their authentication status.
  // If logged in, redirect to the dashboard.
  useEffect(() => {
    const checkStatus = async () => {
      // Implement API call here
    };
    checkStatus();
  }, []);

  // Read about useState to understand how to manage component state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // This function handles input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Read about the spread operator (...) to understand this syntax
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // // TODO: Implement the sign-up operation
  // // This function should send form data to the server
  // // and handle success/failure responses.
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   // Implement the sign-up logic here
  // };

  // // TODO: Use JSX to create a sign-up form with input fields for:
  // // - Username
  // // - Email
  // // - Password
  // // - A submit button
  // return (
  //   <div>
  //     {/* Implement the form UI here */}
  //   </div>
  // );


  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    try {
      const response = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent for session management
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // If successful, redirect to the dashboard
        navigate("/dashboard");
      } else {
        // If an error occurs (duplicate email, missing fields, etc.), display the error message
        alert(result.message);
      }
    } catch (err) {
      console.error("Error during signup:", err);
    }
  };

  // Sign-up form JSX
  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );








};

export default Signup;
