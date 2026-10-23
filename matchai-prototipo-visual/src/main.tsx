import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, useLocation } from "react-router-dom";
import { MatchAIDemo, type DemoScreen } from "./MockApp";
import "./legacy.css";
import "./responsive.css";

const screens: DemoScreen[] = ["feed", "publicar", "ranking", "alertas", "perfil", "login", "cadastro"];
function Routes() {
  const location = useLocation();
  const screen = location.pathname.split("/").filter(Boolean)[1];
  if (location.pathname === "/" || location.pathname === "/demo") return <Navigate to="/demo/feed" replace />;
  if (!screen || !screens.includes(screen as DemoScreen)) return <Navigate to="/demo/feed" replace />;
  return <MatchAIDemo screen={screen as DemoScreen} />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><BrowserRouter><Routes /></BrowserRouter></React.StrictMode>
);
