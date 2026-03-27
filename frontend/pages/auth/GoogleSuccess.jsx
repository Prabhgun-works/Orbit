import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GoogleSuccess = () => {
  const { loginWithGoogle } = useAuth();
  const navigate            = useNavigate();
  const [params]            = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      navigate("/login?error=google_failed");
      return;
    }

    loginWithGoogle(token);
    navigate("/dashboard");
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      color: "var(--color-text-secondary, #73726c)",
      fontSize: "14px",
    }}>
      Signing you in…
    </div>
  );
};

export default GoogleSuccess;
