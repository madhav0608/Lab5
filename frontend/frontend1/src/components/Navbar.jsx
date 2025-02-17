import React from "react";
import { useNavigate } from "react-router";

const Navbar = () => {
  const navigate = useNavigate(); // Use this to redirect users

  // TODO: Implement the handleLogout function.
  // This function should do an API call to log the user out.
  // On successful logout, redirect the user to the login page.
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      // Make a request to the backend /logout route
      const response = await fetch("http://localhost:4000/logout", {
        method: "GET",
        credentials: "include", // To include cookies (session data)
      });

      if (response.ok) {
        // If logout is successful, navigate to the login page
        navigate("/login");
      } else {
        console.error("Error logging out");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav>
      <button onClick={() => navigate("/dashboard")}>Home</button>
      <button onClick={() => navigate("/products")}>Products</button>
      <button onClick={() => navigate("/cart")}>Cart</button>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
