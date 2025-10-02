import { useEffect, useState } from "react";
import axios from "axios";
import Login from "./Login";
import { BrowserRouter, Route, Routes } from 'react-router-dom';


const apiUrl = process.env.REACT_APP_API_BASE_URL;

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )

}

export default App;
