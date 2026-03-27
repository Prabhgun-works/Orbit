import CPTracker from "../pages/compPrograming/CpDash"
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";

export default function App() {
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
  return(
    
    <CPTracker/>
    
  )
}