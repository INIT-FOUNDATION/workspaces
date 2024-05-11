import React from "react";
import { Route, Routes } from "react-router-dom";
import Workspaces from "./components/Workspaces/Workspaces";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const App: React.FC = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/:token" element={<Workspaces />} />
      </Routes>
    </>
  );
};

export default App;
