import { ToastOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastUtils = {
  success: (message: string, options = {}) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  },
  warning: (message: string, options: ToastOptions = {}) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  },
  error: (message: string, options: ToastOptions = {}) => {
    toast.error(message ? message : "Something Went Wrong!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  },
  info: (message: string, options: ToastOptions = {}) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  },
};

export default toastUtils;
