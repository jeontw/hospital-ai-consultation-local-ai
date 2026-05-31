import axios from "axios";

const BASE_URL = "http://localhost:8080";

export const getAiModel = () => {
  return axios.get(`${BASE_URL}/ai/model`);
};

export const updateAiModel = (model) => {
  return axios.post(`${BASE_URL}/ai/model`, { model });
};
