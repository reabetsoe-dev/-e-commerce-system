import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.8 20.2c.7-3.8 3.1-5.8 7.2-5.8s6.5 2 7.2 5.8" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 6.5h15v11h-15z" />
      <path d="m5.2 7.2 6.8 5.3 6.8-5.3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10.2h9v8.2h-9z" />
      <path d="M9.2 10.2V8.1a2.8 2.8 0 0 1 5.6 0v2.1" />
      <path d="M12 14v1.2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 12s3.2-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.2 5.5-9.2 5.5S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.5 3.5 17 17" />
      <path d="M9.4 5.1A9.8 9.8 0 0 1 12 4.8c6 0 9.2 7.2 9.2 7.2a15.3 15.3 0 0 1-2.4 3.3" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
      <path d="M6.8 6.9A15 15 0 0 0 2.8 12s3.2 7.2 9.2 7.2a9.6 9.6 0 0 0 4.1-.9" />
    </svg>
  );
}

function validateRegisterForm(form) {
  if (!form.name.trim()) {
    return "Please enter your full name.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
    return "Password must include uppercase, lowercase, and a number.";
  }
  if (form.password !== form.confirmPassword) {
    return "Password and confirm password do not match.";
  }
  return "";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, getErrorMessage } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    return location.state?.from?.pathname || "/";
  }, [location.state]);

  const onChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    if (mode === "register") {
      const validationError = validateRegisterForm(form);
      if (validationError) {
        setBusy(false);
        setError(validationError);
        return;
      }
    }

    try {
      let authenticatedUser;
      if (mode === "login") {
        authenticatedUser = await login({ email: form.email, password: form.password });
      } else {
        authenticatedUser = await register({ name: form.name, email: form.email, password: form.password });
      }
      navigate(authenticatedUser?.role === "admin" ? "/admin" : nextPath, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    navigate("/", { replace: true });
  };

  return (
    <section className="auth-layout auth-screen" data-cy="auth-page">
      <button
        type="button"
        className="auth-back-button"
        onClick={goBack}
        aria-label="Go back"
        title="Go back"
      >
        <span aria-hidden="true">&larr;</span>
      </button>
      <section className={`auth-panel auth-card ${mode === "register" ? "register-mode" : ""}`}>
        <div className="auth-avatar">
          <UserIcon />
        </div>

        <p className="auth-title">{mode === "login" ? "Member Login" : "Create Account"}</p>

        <div className="auth-mode-tabs" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            data-cy="auth-tab-login"
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            data-cy="auth-tab-register"
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit} data-cy="auth-form">
          {mode === "register" && (
            <label className="auth-field">
              <span className="sr-only">Full Name</span>
              <span className="auth-field-icon">
                <UserIcon />
              </span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
                placeholder="Full Name"
                data-cy="register-name-input"
              />
            </label>
          )}
          <label className="auth-field">
            <span className="sr-only">Email</span>
            <span className="auth-field-icon">
              <MailIcon />
            </span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              placeholder="Email ID"
              data-cy="auth-email-input"
            />
          </label>
          <label className="auth-field">
            <span className="sr-only">Password</span>
            <span className="auth-field-icon">
              <LockIcon />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
              placeholder="Password"
              data-cy="auth-password-input"
            />
            <button
              type="button"
              className="auth-password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((state) => !state)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </label>

          {mode === "register" && (
            <label className="auth-field">
              <span className="sr-only">Confirm Password</span>
              <span className="auth-field-icon">
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                required
                minLength={8}
                placeholder="Confirm Password"
                data-cy="register-confirm-password-input"
              />
            </label>
          )}

          {mode === "login" && (
            <div className="auth-options">
              <label className="auth-remember">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password">Forget password?</Link>
            </div>
          )}

          {error && (
            <p className="error notice" data-cy="auth-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="auth-submit"
            disabled={busy}
            data-cy="auth-submit-button"
          >
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>
      </section>
    </section>
  );
}
