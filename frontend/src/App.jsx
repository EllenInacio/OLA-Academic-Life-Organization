import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AreaLogada from "./components/AreaLogada";
import RotaProtegida from "./components/RotaProtegida";
import RotaPublica from "./components/RotaPublica";
import CalendarioPage from "./pages/CalendarioPage";
import CadastroPage from "./pages/CadastroPage";
import LoginPage from "./pages/LoginPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import RedefinirSenhaPage from "./pages/RedefinirSenhaPage";
import VerificacaoPage from "./pages/VerificacaoPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RotaPublica />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/verificacao" element={<VerificacaoPage />} />
            <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
          </Route>

          <Route element={<RotaProtegida />}>
            <Route element={<AreaLogada />}>
              <Route path="/" element={<CalendarioPage />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
