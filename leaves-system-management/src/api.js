// import axios from "axios";

// const api = axios.create({
//   // baseURL: process.env.REACT_APP_API_URL || `http://localhost:7014`,
//     baseURL: process.env.REACT_APP_API_URL || ``,
//   withCredentials: true,
// });

// export default api;
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;