import axios from "axios";

const BASE_URL = "http://localhost:8080";

export const getDoctors = () => {
  return axios.get(`${BASE_URL}/doctors`);
};
