import axios from "axios";

const BASE_URL = "http://localhost:8080";

export const createAppointment = (appointment) => {
  return axios.post(`${BASE_URL}/appointments`, appointment);
};

export const getAppointments = () => {
  return axios.get(`${BASE_URL}/appointments`);
};

export const getAppointmentsByPatient = (patientId) => {
  return axios.get(`${BASE_URL}/appointments/patient/${patientId}`);
};

export const getAppointmentsByConsultation = (consultationId) => {
  return axios.get(`${BASE_URL}/appointments/consultation/${consultationId}`);
};

export const createAppointmentDraft = (consultationId) => {
  return axios.post(`${BASE_URL}/appointments/draft/${consultationId}`);
};

export const updateAppointmentById = (appointmentId, appointment) => {
  return axios.put(`${BASE_URL}/appointments/${appointmentId}`, appointment);
};

export const updateAppointmentStatus = (appointmentId, status) => {
  return axios.patch(`${BASE_URL}/appointments/${appointmentId}/status`, {
    status,
  });
};

export const deleteAppointmentById = (appointmentId) => {
  return axios.delete(`${BASE_URL}/appointments/${appointmentId}`);
};
