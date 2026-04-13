import axios from "axios";

const API = "http://127.0.0.1:8000";

export const getForecast = async (product, days) => {
  const res = await axios.get(`${API}/predict?product=${product}&days=${days}`);
  return res.data;
};