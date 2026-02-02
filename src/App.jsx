import { Routes, Route } from "react-router";
import { routes } from "@/router.jsx";
import { AddUser } from "@/modules/user/addUser.jsx";
import { useUser } from "@/hooks/useUserData.js";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/sidebar.jsx";
import { useNavigate } from "react-router";
import { getBackgroundStyle } from "@/constants/backgrounds.js";

const USER_RESET_REQUESTED = "userResetRequested";

function App() {
  const { doesUserExist, getUserData, USER_DATA_UPDATED } = useUser();
  const navigate = useNavigate();
  const [validUser, setValidUser] = useState(doesUserExist);

  useEffect(() => {
    const handler = () => {
      setValidUser(false);
      navigate("/");
    };
    window.addEventListener(USER_RESET_REQUESTED, handler);
    return () => window.removeEventListener(USER_RESET_REQUESTED, handler);
  }, [navigate]);

  useEffect(() => {
    const applyBackground = () => {
      const data = validUser ? getUserData() : null;
      const root = document.documentElement.style;
      root.backgroundAttachment = "fixed";
      if (data?.backgroundImage) {
        root.background = "#0d0d0f";
        root.backgroundImage = `url(${data.backgroundImage})`;
        root.backgroundSize = "cover";
        root.backgroundPosition = "center";
      } else {
        root.backgroundImage = "none";
        const id = data?.background ?? "default";
        root.background = getBackgroundStyle(id);
      }
    };
    applyBackground();
    const onUpdated = () => applyBackground();
    window.addEventListener(USER_DATA_UPDATED, onUpdated);
    return () => window.removeEventListener(USER_DATA_UPDATED, onUpdated);
  }, [validUser, getUserData, USER_DATA_UPDATED]);

  const handleResetUser = () => {
    setValidUser(false);
    navigate("/");
  };
  if (!validUser) {
    return (
      <div className="app">
        <AddUser setValidUser={setValidUser} />
      </div>
    );
  }
  return (
    <div className="app">
      <Sidebar onResetUser={handleResetUser} />
      <div className="appContent">
        <Routes>
          {routes?.map((route) => {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            );
          })}
        </Routes>
      </div>
    </div>
  );
}

export default App;
