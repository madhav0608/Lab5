import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Products = () => {
  const navigate = useNavigate(); // Use this to redirect users

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Check if the user is logged in, and redirect if not
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",  // ✅ Ensures session is checked properly
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.status === 200) {
          fetchProducts(); // Fetch products if authenticated
        } else {
          navigate("/login"); // Redirect to login page if not authenticated
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login");
      }
    };
    checkStatus();
  }, [navigate]);

  // Fetch products from the API
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/list-products`, {
        method: "GET",
        credentials: "include",  // ✅ Ensures session cookies are included
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status !== 200) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setProducts(data.products); // ✅ Set all products
      setFilteredProducts(data.products); // ✅ Initialize filtered products
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  
  // Handle quantity changes for each product

  /*
    instead of passing direct object to set Quantities , we should pass a function to setQuantities
    as it is not need to pass prev_quantites to setQuantities ,
    we can directly access it by prev , like syntax is setQuantities((prev)=>{new state})
  */

  const handleQuantityChange = (productId, change) => {
    setQuantities((prev) => {
      const newQty = (prev[productId] || 0) + change;
      return newQty < 0 ? prev : { ...prev, [productId]: newQty };
    });
  };

  // Add product to the cart with the chosen quantity
  const addToCart = async (productId) => {
    const quantity = quantities[productId] || 0;
  
    if (quantity <= 0) {
      setErrorMessage("Please select at least 1 quantity.");
      return;
    }
  
    // Fetch the product stock from the products list
    const product = products.find((prod) => prod.product_id === productId);
    if (!product) return;
  
    if (quantity > product.stock_quantity) {
      setErrorMessage("Quantity exceeds available stock!");
      return;
    }
  
    try {
      const res = await fetch(`${apiUrl}/add-to-cart`, {
        method: "POST",
        credentials: "include", // ✅ Ensures session is included
        body: JSON.stringify({ product_id: productId, quantity }), // Use product_id instead of productId
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await res.json();
      if (res.status === 200) {
        setErrorMessage(""); // Clear error if successful
        alert("Product added to cart!");
      } else {
        setErrorMessage(data.message || "Failed to add product to cart.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setErrorMessage("Failed to add product to cart.");
    }
  };
  
  // Implement the search functionality
  const handleSearch = (e) => {
    e.preventDefault(); // default action is to reload the page, we don't want that
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  return (
    <>
      <Navbar />
      <div>
        <h1>Product List</h1>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Stock Available</th>
              <th>Quantity</th>
              <th>Action</th>
            </tr>
          </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.sort((a, b) => a.product_id - b.product_id).map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <button onClick={() => handleQuantityChange(product.product_id, -1)}>-</button>
                      {quantities[product.product_id] || 0}
                      <button onClick={() => handleQuantityChange(product.product_id, 1)}>+</button>
                    </td>
                    <td>
                      <button onClick={() => { addToCart(product.product_id); setQuantities((prev) => ({ ...prev, [product.product_id]: 0 })); }}>Add to Cart</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", fontWeight: "bold", color: "red" }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
        </table>
      </div>
    </>
  );
};

export default Products;
