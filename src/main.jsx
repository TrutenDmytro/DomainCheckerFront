import { PrimeReactProvider } from "primereact/api";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../node_modules/primeflex/primeflex.css";
import "./App.css";
import "primereact/resources/themes/lara-dark-green/theme.css"
import 'primeicons/primeicons.css';

createRoot(document.getElementById("root")).render(
  <PrimeReactProvider>
    <App />
  </PrimeReactProvider>
);
