import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./style.css";
import "./dark-theme.css";
import "./level-colors.css";
import "./styles/transitions.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
