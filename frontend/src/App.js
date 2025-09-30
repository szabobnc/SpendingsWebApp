import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/hello/")
      .then(res => {
        setMessage(res.data.message)
        console.log(res.data)
      } )
      .catch(err => console.error(err));
  }, []);
  return <h1>From the server: {message}</h1>;
}

export default App;
