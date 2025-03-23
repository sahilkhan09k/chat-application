import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";


export const useChatStore = create((set, get) => ({
    messages : [],
    users : [],
    selectedUser : null,
    isUsersLoading : false,
    isMessagesLoading : false,

    getUser : async () => {
        set({isUsersLoading : true});
        try {
            const res = await axiosInstance.get("/message/get-users");
            set({users : res.data?.message})
        } catch (error) {
            const errorMessage = error.response?.data?.message || "someting went wrong";
            toast.error(errorMessage);
        } finally {
            set({isUsersLoading : false});
        }
    },

    getMessages : async (userId) => {

        set({isMessagesLoading : true});
        try {
            const res = await axiosInstance.get(`/message/get-messages/${userId}`);
            set({messages : res.data.message})
            // console.log("Message format", res);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "someting went wrong";
            toast.error(errorMessage);
        }finally {
            set({isMessagesLoading : false})
        }
    },

    setSelectedUser : (selectedUser) => {
        set({selectedUser})
    },

    sendMessage : async (messageData) => {
         const {selectedUser, messages} = get();

         try {
            const res = await axiosInstance.post(`/message/send-message/${selectedUser?._id}`, messageData);
            console.log("message data", messageData);
            console.log("Message results", res.data);
            set({messages : [...messages, res.data.message]})
         } catch (error) {
            const errorMessage = error.response?.data?.message || "someting went wrong";
            toast.error(errorMessage);
         }
    },

    subscribeToMessage : () => {
      const {selectedUser} = get();
      if(!selectedUser) return;

      const socket = useAuthStore.getState().socket;

      socket.on("newMessage", (message) => {

        if(message.senderId !== selectedUser?._id) return;

      set({
        messages : [...get().messages, message],
      })
    })
  },  

  unsubscribeToMessages : () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  }
}))