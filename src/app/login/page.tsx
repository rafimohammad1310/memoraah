"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
  User,
  applyActionCode,
  verifyPasswordResetCode,
  UserCredential,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, db } from "@/firebase/config";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

function AuthPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [manualRefreshLoading, setManualRefreshLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  useEffect(() => {
    // Get referral code from URL if exists
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      // Set cookie as backup
      document.cookie = `referral_code=${ref}; max-age=${30*24*60*60}; path=/`;
    }
  }, [searchParams]);

  useEffect(() => {
    const handleEmailVerification = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      if (mode === 'verifyEmail' && oobCode) {
        try {
          setLoading(true);
          await applyActionCode(auth, oobCode);

          if (auth.currentUser) {
            try {
              await auth.currentUser.reload();
              await auth.currentUser.getIdToken(true);
              router.push(redirectPath);
            } catch (error) {
              if (!(error instanceof FirebaseError)) throw error;
              if (error.code === 'auth/user-token-expired') {
                setError("Verification complete but session expired. Please log in again.");
                await signOut(auth);
              } else {
                throw error;
              }
            }
          } else {
            const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
            router.push(`/login?email=${encodeURIComponent(verifiedEmail)}&verified=true&redirect=${redirectPath}`);
          }
        } catch {
          setError("Email verification failed. The link may have expired or been already used.");
        } finally {
          setLoading(false);
        }
      }
    };

    handleEmailVerification();
  }, [router, searchParams, redirectPath]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (user) {
        if (!user.emailVerified) {
          // Only start checking if we haven't already sent verification
          if (!emailSent) {
            await sendEmailVerification(user);
            setEmailSent(true);
          }
          
          // Check immediately
          await checkVerificationStatus(user);
          
          // Then set interval for periodic checks
          const interval = setInterval(async () => {
            await checkVerificationStatus(user);
          }, 10000);

          return () => clearInterval(interval);
        } else {
          router.push(redirectPath);
        }
      }
    });

    return () => unsubscribe();
  }, [router, redirectPath, emailSent]);

  const checkVerificationStatus = async (user: User) => {
    try {
      await user.reload();
      const updatedUser = auth.currentUser;
      
      if (updatedUser?.emailVerified) {
        setVerificationChecked(true);
        router.push(redirectPath);
      }
    } catch (error) {
      if (!(error instanceof FirebaseError)) throw error;
      if (error.code === 'auth/user-token-expired') {
        setError("Your session has expired. Please log in again.");
      } else {
        console.error("Verification check error:", error);
      }
    }
  };

  const generateReferralCode = (input: string): string => {
    const base = input.substring(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REF-${base}${random}`;
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const handleSocialSignIn = async (credential: UserCredential) => {
    const user = credential.user;
    const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

    if (isNewUser) {
      const userData = {
        uid: user.uid,
        name: user.displayName || name || "",
        email: user.email || "",
        phone: user.phoneNumber || phone || "",
        address: address || "",
        referralCode: generateReferralCode(user.email || user.uid),
        referredBy: referralCode || getCookie('referral_code') || null,
        createdAt: serverTimestamp(),
        emailVerified: user.emailVerified || false,
        lastLogin: serverTimestamp()
      };

      await setDoc(doc(db, "users", user.uid), userData);
    } else {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp()
      });
    }

    router.push(redirectPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await setPersistence(auth, browserLocalPersistence);

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          setEmailSent(true);
          setError("Please verify your email first. A new verification link has been sent.");
          return;
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Immediately set email sent state
        setEmailSent(true);
        
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);

        const userData = {
          name,
          email,
          phone,
          address,
          referralCode: generateReferralCode(email),
          referredBy: referralCode || getCookie('referral_code') || null,
          createdAt: serverTimestamp(),
          emailVerified: false,
          lastLogin: serverTimestamp()
        };
        
        await setDoc(doc(db, "users", userCredential.user.uid), userData);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleSocialSignIn(result);
    } catch {
      setError("Failed to sign in with Google");
    }
  };

  const handleAuthError = (err: unknown) => {
    let errorMessage = "An error occurred";
    const authError = err instanceof FirebaseError
      ? err
      : new FirebaseError("auth/unknown", err instanceof Error ? err.message : "Authentication failed");

    switch (authError.code) {
      case "auth/email-already-in-use":
        errorMessage = "Email already in use";
        break;
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        errorMessage = "Invalid email or password";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many attempts. Try again later";
        break;
      default:
        errorMessage = authError.message || "Authentication failed";
    }

    setError(errorMessage);
  };

  const resendVerification = async () => {
    try {
      setLoading(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setError("New verification email sent. Please check your inbox.");
      }
    } catch {
      setError("Failed to resend verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (emailSent && !verificationChecked) {
      timeout = setTimeout(() => {
        setError("Verification is taking longer than expected. Please check your email and refresh the page.");
      }, 300000); // 5 minutes
    }

    return () => clearTimeout(timeout);
  }, [emailSent, verificationChecked]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            {emailSent ? "Verify Your Email" : isLogin ? "Welcome Back" : "Create Your Account"}
          </h1>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              {emailSent && !verificationChecked && (
                <p className="mt-2 text-sm text-gray-600">Checking verification status...</p>
              )}
            </div>
          )}

          {emailSent ? (
            <div className="space-y-4 text-center">
              <p className="text-gray-600">
                We&apos;ve sent a verification link to <span className="font-medium">{email}</span>.
              </p>
              <p className="text-sm text-gray-500">
                You&apos;ll be automatically redirected once verified. This may take a few seconds.
              </p>

              <div className="pt-4">
                <button
                  onClick={resendVerification}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>

              <button
                onClick={async () => {
                  setManualRefreshLoading(true);
                  try {
                    if (auth.currentUser) {
                      await auth.currentUser.reload();
                      if (auth.currentUser.emailVerified) {
                        router.push(redirectPath);
                      } else {
                        setError("Email not verified yet. Please check your inbox.");
                      }
                    }
                  } catch {
                    setError("Failed to check verification status. Try logging in again.");
                  } finally {
                    setManualRefreshLoading(false);
                  }
                }}
                disabled={manualRefreshLoading}
                className="text-blue-600 hover:text-blue-500 font-medium text-sm"
              >
                {manualRefreshLoading ? 'Checking...' : 'I\'ve verified my email - Refresh status'}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Image src="/google-logo.png" alt="Google" width={20} height={20} priority />
                  Continue with Google
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="name">Full Name</label>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email">Email Address</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="phone">Phone Number</label>
                      <PhoneInput
                        country={'in'}
                        value={phone}
                        onChange={setPhone}
                        inputProps={{ required: true, disabled: loading }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="address">Address</label>
                      <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} disabled={loading} />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label htmlFor="password">Password</label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={loading} />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} disabled={loading} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="text-center text-sm">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                >
                  {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
