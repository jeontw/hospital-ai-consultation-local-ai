import axios from "axios";

const BASE_URL = "http://localhost:8080";

export const getConsultations = () => {
  return axios.get(`${BASE_URL}/consultations`);
};

export const getConsultationsByPatient = (patientId) => {
  return axios.get(`${BASE_URL}/consultations/patient/${patientId}`);
};

export const uploadConsultationAudio = (patientId, formData) => {
  return axios.post(`${BASE_URL}/consultations/upload/${patientId}`, formData);
};

export const previewConsultation = (formData) => {
  return axios.post(`${BASE_URL}/consultations/preview`, formData);
};

export const createTextConsultation = (patientId, data) => {
  return axios.post(`${BASE_URL}/consultations/${patientId}`, data);
};

export const deleteConsultationById = (consultationId) => {
  return axios.delete(`${BASE_URL}/consultations/${consultationId}`);
};

export const updateConsultationById = (consultationId, data) => {
  return axios.put(`${BASE_URL}/consultations/${consultationId}`, data);
};
export const getPatientAiInsight = (patientId) => {
  return axios.get(`${BASE_URL}/consultations/patient/${patientId}/insight`);
};
