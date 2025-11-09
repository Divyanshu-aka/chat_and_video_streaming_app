import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImg from "../assets/background.png";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial mode from route
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();

  // Update mode when route changes
  useEffect(() => {
    setIsLogin(location.pathname === "/login");
  }, [location.pathname]);

  const handleLoginDataChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginData({
        ...loginData,
        [name]: e.target.value,
      });
    };

  const handleRegisterDataChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setRegisterData({
        ...registerData,
        [name]: e.target.value,
      });
    };

  const handleLogin = async () => await login(loginData);
  const handleRegister = async () => await register(registerData);

  const toggleMode = () => {
    navigate(isLogin ? "/register" : "/login");
  };

  return (
    <div
      className="min-h-screen w-full flex items-end justify-center p-4 pb-8 relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Main Auth Card with smooth transitions - anchored at bottom */}
      <div className="max-w-md w-full mx-4  relative z-10">
        <div 
          className="bg-white rounded-3xl shadow-xl p-8 md:p-10 transition-all duration-500 ease-in-out origin-bottom"
        >
          {/* Header with transition */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold text-gray-900 mb-2 transition-all duration-300"
              key={isLogin ? "login-title" : "register-title"}
            >
              {isLogin ? "Welcome Back" : "Join ChatStream"}
            </h1>
            <p 
              className="text-gray-600 text-sm transition-all duration-300"
              key={isLogin ? "login-subtitle" : "register-subtitle"}
            >
              {isLogin ? (
                <>
                  Sign in to continue your conversations
                  <br />
                  and video calls
                </>
              ) : (
                <>
                  Create your account to start chatting
                  <br />
                  and making video calls
                </>
              )}
            </p>
          </div>

          {/* Form fields with smooth transitions */}
          <div className="space-y-4">
            {/* Email field - only for register */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isLogin
                  ? "max-h-0 opacity-0 -mb-4"
                  : "max-h-20 opacity-100"
              }`}
            >
              <input
                type="email"
                placeholder="Your email address"
                value={registerData.email}
                onChange={handleRegisterDataChange("email")}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Username field */}
            <div className="transition-all duration-300">
              <input
                type="text"
                placeholder={
                  isLogin ? "Username or Email" : "Choose a username"
                }
                value={isLogin ? loginData.username : registerData.username}
                onChange={
                  isLogin
                    ? handleLoginDataChange("username")
                    : handleRegisterDataChange("username")
                }
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-300"
              />
            </div>

            {/* Password field */}
            <div className="relative transition-all duration-300">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Password" : "Create a password"}
                value={isLogin ? loginData.password : registerData.password}
                onChange={
                  isLogin
                    ? handleLoginDataChange("password")
                    : handleRegisterDataChange("password")
                }
                className="w-full px-4 py-3.5 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="w-full h-[0.5px] bg-gray-500"></div>

            {/* Submit button */}
            <button
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={
                isLogin
                  ? !loginData.username || !loginData.password
                  : Object.values(registerData).some((val) => !val)
              }
              className="w-full bg-[#ffd89b] hover:bg-[#ffc870] disabled:bg-gray-200 disabled:text-gray-400 text-gray-900 font-medium py-3.5 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLogin ? "Sign in" : "Create Account"}
            </button>

            <div className="text-center text-sm text-gray-500 my-6">
              — Or {isLogin ? "Sign in" : "Sign up"} with —
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </button>

              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
            </div>

            {/* Toggle between login and register */}
            <div className="text-center text-sm text-gray-600 mt-6">
              {isLogin ? "New to our platform?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-gray-900 font-medium hover:underline"
              >
                {isLogin ? "Create Account" : "Sign In"}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          © 2025 ChatStream |{" "}
          <a href="#" className="hover:text-gray-700">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
