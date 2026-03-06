"use client";

import { useMemo, useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Home, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function LoginPage() {
  const auth = useMemo(() => getClientAuth(), []);
  const db = useMemo(() => getClientDb(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const router = useRouter();
  const { initializeAuth } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!auth || !db) {
      setError("Firebase not ready. Please refresh and try again.");
      return;
    }
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Login successful:", user.uid);
      
      // Check if user document exists in Firestore, create if not
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log("User document not found, creating one...");
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || "User",
          email: user.email,
          role: "landlord",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        console.log("User document created in Firestore");
      } else {
        // Update last login
        await setDoc(doc(db, "users", user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
        console.log("User document updated with last login");
      }
      
      setSuccess(true);
      
      // Initialize auth store and redirect
      initializeAuth();
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/user-not-found') {
          setError("No account found with this email address");
        } else if (firebaseError.code === 'auth/wrong-password') {
          setError("Incorrect password");
        } else if (firebaseError.code === 'auth/invalid-email') {
          setError("Invalid email address");
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetNotice("");
    setError("");
    if (!email) {
      setError("Enter your email to receive a reset link");
      return;
    }
    try {
      if (!auth) throw new Error("Auth not ready");
      await sendPasswordResetEmail(auth, email);
      setResetNotice("Password reset email sent. Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to send reset email. Try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-green-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sign in to your RentMatic account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h3>
                <p className="text-gray-600">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/50"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {(error || resetNotice) && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error || resetNotice}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-medium transition-all duration-300"
                >
                  {loading ? "Signing In..." : "Sign In"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={handleResetPassword} className="mt-3 text-sm text-green-600 hover:text-green-700 underline">
                    Forgot password?
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center space-y-4">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors hover:underline"
                >
                  Sign up here
                </Link>
              </p>

              <div className="pt-4 border-t border-green-100">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Homepage
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}