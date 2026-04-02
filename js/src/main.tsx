import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import initWasm from "./backend/rust/idrdesign_app";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

await initWasm();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </TooltipProvider>
  </StrictMode>,
);
