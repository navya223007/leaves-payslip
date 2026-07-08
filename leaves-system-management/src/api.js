import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || `http://${window.location.hostname}:7013`,
  withCredentials: true,
});

export default api;
