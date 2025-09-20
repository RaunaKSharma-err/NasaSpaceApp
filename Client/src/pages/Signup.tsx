import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Satellite,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  Zap,
  User,
} from "lucide-react";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [UserName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle authentication here
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-cosmic flex items-center justify-center p-4">
      <div className="w-full max-w-full space-y-8 md:flex md:justify-between md:items-center">
        {/* Header */}
        <div className="text-center w-full">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-stellar rounded-full">
              <Satellite className="h-12 w-12 text-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-aurora bg-clip-text text-transparent mb-2">
            Welcome to AirWatch
          </h1>
          <p className="text-foreground/70 mb-4">
            NASA-powered environmental monitoring platform
          </p>
          <Badge
            variant="secondary"
            className="bg-white/10 text-white border-white/20"
          >
            <Zap className="h-3 w-3 mr-1" />
            Space Apps Challenge 2025
          </Badge>
        </div>
        <div className="w-full mr-24 -mt-6">
          {/* Login Form */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-cosmic">
            <CardHeader>
              <CardTitle className="text-center text-foreground">
                Sign up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="name"
                      placeholder="Enter your name"
                      value={UserName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="aurora"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing up..." : "Sign up"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
                <Button variant="outline" className="w-full">
                  <Chrome className="h-4 w-4 mr-2" />
                  Google
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
