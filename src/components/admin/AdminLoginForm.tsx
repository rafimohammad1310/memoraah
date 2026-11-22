"use client";
import { useState } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation'
export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter()
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const token = await credential.user.getIdTokenResult(true);
        if (token.claims.admin !== true) {
          setError("This account does not have administrator access.");
          return;
        }
        router.replace('/admin/dashboard')
      } catch {
        setError('Invalid email or password')
      } finally {
        setLoading(false)
      }
    };

  const handlePasswordReset = async () => {
    setError("");
    setResetSent(false);
    if (!email.trim()) {
      setError("Enter your admin email address first.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch {
      setError("Could not send the reset email. Check the address and Firebase email settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {resetSent && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">If the account is eligible, a password reset link has been sent.</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
      <button type="button" onClick={handlePasswordReset} disabled={loading} className="w-full text-sm font-medium text-[#7654b5] hover:underline disabled:opacity-50">
        Forgot password?
      </button>
    </form>
  );
}
