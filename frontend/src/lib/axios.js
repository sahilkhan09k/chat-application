import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "developement" ? "http://localhost:3000/api/v1" : "/api",
    withCredentials: true,
})