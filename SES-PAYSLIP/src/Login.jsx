import React, { useState } from "react";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Only required validation
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      await onLogin({
        username: username.trim(),
        password: password.trim(),
      });
    } catch (err) {
      console.error("Login failed:", err);

      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{
        height: "100vh",
        background: "linear-gradient(to right, #0d6efd, #6ea8fe)",
      }}
    >
      <div
        className="card shadow"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "12px",
          padding: "25px",
        }}
      >
        <h3
          className="text-center mb-4"
          style={{
            fontWeight: "700",
            color: "#0d6efd",
          }}
        >
          Login
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-3">
            <label className="form-label">Username</label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>

            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && <div className="alert alert-danger py-2">{error}</div>}

          {/* Button */}
          <button
            type="submit"
            className="btn w-100"
            style={{
              backgroundColor: "#0d6efd",
              color: "#fff",
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
