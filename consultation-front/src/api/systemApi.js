import axios from "axios";

const BASE_URL = "http://localhost:8080";

export const resetExperimentData = () => {
  return axios.delete(`${BASE_URL}/system/experiment-data`);
};
