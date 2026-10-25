import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { initStorage } from "./storage";
import "./styles/main.scss";

// offlineFirst: tenta buscar mesmo offline, para o service worker poder responder com o cache.
const queryClient = new QueryClient({
  defaultOptions: { queries: { networkMode: "offlineFirst" } },
});

// Favoritos e lista vivem no IndexedDB: carrega (e migra o que estava no localStorage) antes do
// primeiro render, para os hooks já nascerem com os dados. Se falhar, o app segue no localStorage.
initStorage().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
});
