import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";

function Main() {

    const { user, loading } = useAuth();

    return (
        <div>
            <h1>Main page</h1>
            <h2>Hello {user.name}!</h2>
        </div>
    );
}

export default Main;