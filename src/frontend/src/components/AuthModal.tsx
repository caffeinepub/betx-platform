import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBetting } from "../context/BettingContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode: "login" | "register";
}

export function AuthModal({ open, onClose, initialMode }: AuthModalProps) {
  const { login, register } = useBetting();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    displayName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const success = login(loginForm.username.trim(), loginForm.password.trim());
    setLoading(false);
    if (success) {
      toast.success("Welcome back!");
      onClose();
      setLoginForm({ username: "", password: "" });
    } else {
      toast.error("Invalid username or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { displayName, username, password, confirmPassword } = registerForm;
    if (!displayName || !username || !password) {
      toast.error("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const success = register(displayName, username, password);
    setLoading(false);
    if (success) {
      toast.success("Account created! Welcome bonus of ₹50 added 🎉");
      onClose();
      setRegisterForm({
        displayName: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
    } else {
      toast.error("Username already taken");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[420px] bg-popover border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-neon/10 rounded-sm flex items-center justify-center">
                <Zap className="w-4 h-4 text-neon" />
              </div>
              <DialogTitle className="font-display text-lg">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex bg-secondary rounded-sm p-0.5 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all ${
                mode === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-sm">
                  Username
                </Label>
                <Input
                  id="login-username"
                  placeholder="Enter username"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className="bg-secondary border-border rounded-sm"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="bg-secondary border-border rounded-sm pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm h-10"
              >
                {loading ? "Logging in..." : "Log In"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Register a new account to get started
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-sm">
                  Display Name
                </Label>
                <Input
                  id="reg-name"
                  placeholder="Your name"
                  value={registerForm.displayName}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      displayName: e.target.value,
                    }))
                  }
                  className="bg-secondary border-border rounded-sm"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-username" className="text-sm">
                  Username
                </Label>
                <Input
                  id="reg-username"
                  placeholder="Choose a username"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      username: e.target.value,
                    }))
                  }
                  className="bg-secondary border-border rounded-sm"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border rounded-sm pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-sm">
                  Confirm Password
                </Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="bg-secondary border-border rounded-sm"
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-neon text-panel-dark hover:bg-neon/90 font-bold rounded-sm h-10"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="p-3 bg-neon/5 border border-neon/20 rounded-sm">
                <p className="text-xs text-neon font-medium">
                  🎁 Welcome bonus of ₹50 on registration
                </p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
