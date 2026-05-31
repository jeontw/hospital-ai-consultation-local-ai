import axios from "axios";

const BASE_URL = "http://localhost:8080";

export const getDoctors = () => {
  return axios.get(`${BASE_URL}/doctors`);
};

export const createDoctor = (doctor) => {
  return axios.post(`${BASE_URL}/doctors`, doctor);
};

export const updateDoctorById = (doctorId, doctor) => {
  return axios.put(`${BASE_URL}/doctors/${doctorId}`, doctor);
};

export const deleteDoctorById = (doctorId) => {
  return axios.delete(`${BASE_URL}/doctors/${doctorId}`);
};
