import React from "react";
import RouterPage from "./pages/RouterPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const App = () => {
  return (
    <AuthProvider>
      <RouterPage />
    </AuthProvider>
  );
};

export default App;
