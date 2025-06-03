import axios from "axios";

export const createUser = async (email, password) => {
  const res = await axios.post("http://localhost:8000/api/create-user", { email, password });
  return res.data;
};

export const getAllUsers = async () => {
  const res = await axios.get("http://localhost:8000/api/list-users");
  return res.data.users;
};

export const resetPassword = async (email) => {
  const res = await axios.post("http://localhost:8000/api/reset-password", { email });
  return res.data;
};

export const deleteUser = async (uid) => {
  const res = await axios.post("http://localhost:8000/api/delete-user", { uid });
  return res.data;
};
