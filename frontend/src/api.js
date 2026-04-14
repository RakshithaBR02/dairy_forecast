import axios from "axios";

const API = "http://127.0.0.1:8000";

export const getForecast = async (product, days, region) => {
  const res = await axios.get(`${API}/predict`, {
    params: { product, days, region }
  });
  return res.data;
};