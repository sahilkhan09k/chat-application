import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";


export const useAuthStore = create((set) => ({
    authUser : null,
    isSigningUp : false,
    isLoggingIn : false,
    isUpdatingProfile : false,


    isCheckingAuth: true,

    checkAuth : async () => {
        try {
            const res = await axiosInstance.get("/user/get-current-user")
            set({authUser : res.data})
        } catch (error) {
            console.log("Error while checking auth", error)
            set({authUser : null})
        } finally{
            set({isCheckingAuth : false})
        }
    },

    signup : async (data) => {
        set({isSigningUp : true})
         try {
          const res =  await axiosInstance.post("/user/signup", data);
          set({authUser : res.data})
          toast.success("Account created succesfully");

         } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
         } finally {
            set({isSigningUp : false})
         }
    },

    login : async (data) => {
       set({isLoggingIn : true})

       try {
        const res = await axiosInstance.post("/user/login", data);
        set({authUser : res.data})
        toast.success("Logged in succesfully");
       } catch (error) {
        const errorMessage = error.response?.data?.message || "someting went wrong";
        toast.error(errorMessage);
       } finally {
        set({isLoggingIn : false})
       }
    },

    logout : async () => {
        try {
            await axiosInstance.post("user/logout");
            set({authUser : null})
            toast.success("Logged out succesfully")
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
        }
    },

    updateProfile : async (data) => {
        set({isUpdatingProfile : true})
        console.log("Data to update profile", data);
        try {
            const res = await axiosInstance.patch("/user/profile-pic", data);
            console.log("Profile updated response", res.data);
            set({authUser : res.data})
            toast.success("Profile updated succesfully");
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
        } finally {
            set({isUpdatingProfile : false})
        }
    }
}));