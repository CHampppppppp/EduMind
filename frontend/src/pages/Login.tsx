import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      login(data);
      navigate("/"); // Redirect to dashboard
    } catch (err) {
      setError("登录失败：用户名或密码错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[120px] dark:bg-purple-900/20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] dark:bg-blue-900/20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 glass rounded-2xl z-10 mx-4"
      >
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg">
            E
          </div>
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            欢迎回来
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            登录您的 EduMind 账号以继续
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium leading-6 text-foreground"
            >
              用户名
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border-0 py-3 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-4 bg-background/50 backdrop-blur-sm transition-all"
                placeholder="请输入用户名"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                密码
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-0 py-3 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-4 bg-background/50 backdrop-blur-sm transition-all"
                placeholder="请输入密码"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg flex items-center"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-2" />
              {error}
            </motion.div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center rounded-xl bg-primary px-3 py-3.5 text-sm font-semibold leading-6 text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link
            to="/register"
            className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors underline decoration-border underline-offset-4 hover:decoration-primary"
          >
            注册新账号
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
