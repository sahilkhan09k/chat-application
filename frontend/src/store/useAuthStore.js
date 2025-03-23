import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client";

const baseUrl = import.meta.env.MODE === "developement" ? "http://localhost:3000" : "/";


export const useAuthStore = create((set, get) => ({
    authUser : null,
    isSigningUp : false,
    isLoggingIn : false,
    isUpdatingProfile : false,
    socket : null,


    isCheckingAuth: true,
    onlineUsers : [],

    checkAuth : async () => {
        try {
            const res = await axiosInstance.get("/user/get-current-user")
            set({authUser : res.data})
            get().connectSocket();
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
          get().connectSocket();

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
        get().connectSocket();
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
            get().disConnectSocket();
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
    },


    connectSocket: () => {

        const {authUser} = get();
        if(!authUser || get().socket?.connected) return;
       const socket = io(baseUrl, {
         query : {
            userId : authUser.message?._id
         }
       });
       socket.connect();
       set({socket : socket});

       socket.on("getOnlineUsers", (userIds) => {
        set({onlineUsers : userIds})
       })
    },

    disConnectSocket : () => {
        if(get().socket?.connected){
            get().socket.disconnect();
            set({socket : null});
        }
    }
}));