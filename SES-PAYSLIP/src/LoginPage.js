import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  Avatar,
  Container,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const roboticsTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00FFFF" },
    secondary: { main: "#00FFFF" },
    background: { default: "#121212", paper: "#1e1e1e" },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ simple boolean

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      setLoading(true); // ✅ start loading

      await onLogin({
        username: username.trim(),
        password: password.trim(),
      });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  return (
    <ThemeProvider theme={roboticsTheme}>
      <CssBaseline />

      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: "primary.main",
              width: 56,
              height: 56,
            }}
          >
            <LockOutlinedIcon fontSize="large" />
          </Avatar>

          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 2,
              fontFamily: "Orbitron",
            }}
          >
            SES-Payslip
          </Typography>

          <Paper elevation={6} sx={{ p: 3, width: "100%" }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default LoginPage;
