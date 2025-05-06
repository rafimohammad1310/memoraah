"use client";

import { useState, useEffect } from "react";
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
  reload
} from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import Image from "next/image";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';


export default function AuthPage() {
    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
  
    // UI states
    const [error, setError] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [verificationChecked, setVerificationChecked] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();

  // Handle email verification from the link
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
              router.push('/');
            } catch (error) {
              if (error.code === 'auth/user-token-expired') {
                setError("Verification complete but session expired. Please log in again.");
                await auth.signOut();
              } else {
                throw error;
              }
            }
          } else {
            const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
            router.push(`/login?email=${encodeURIComponent(verifiedEmail)}&verified=true`);
          }
        } catch (error) {
          setError("Email verification failed. The link may have expired or been already used.");
        } finally {
          setLoading(false);
        }
      }
    };
  
    handleEmailVerification();
  }, [router, searchParams]);

  // Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user && !user.emailVerified) {
        // Check immediately
        await checkVerificationStatus(user);
        
        // Set up less frequent checking (every 10 seconds instead of 2)
        const interval = setInterval(async () => {
          await checkVerificationStatus(user);
        }, 10000); // 10 seconds
        
        return () => clearInterval(interval);
      }
    });
  
    return () => unsubscribe();
  }, [router]);
  const checkVerificationStatus = async (user: User) => {
    try {
      // Only reload if necessary (not too frequently)
      await user.reload();
      
      if (user.emailVerified) {
        setVerificationChecked(true);
        router.push('/');
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      // Handle token expired error specifically
      if (error.code === 'auth/user-token-expired') {
        // Sign out the user and prompt to log in again
        await auth.signOut();
        setError("Your session has expired. Please log in again.");
        setCurrentUser(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login logic
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          setError("Please verify your email first. A new verification link has been sent.");
          return;
        }
      } else {
        // Signup logic
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }

        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send verification email
        await sendEmailVerification(userCredential.user);
        setEmailSent(true);

        // Update profile with name
        await updateProfile(userCredential.user, { displayName: name });

        // Save additional user data to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          phone,
          address,
          createdAt: new Date(),
          emailVerified: false
        });
      }
    } catch (err: any) {
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
    } catch (err) {
      setError("Failed to sign in with Google");
    }
  };

  const handleSocialSignIn = async (credential: UserCredential) => {
    // Save additional user data if it's a new user
    if (credential.user.metadata.creationTime === credential.user.metadata.lastSignInTime) {
      await setDoc(doc(db, "users", credential.user.uid), {
        name: credential.user.displayName,
        email: credential.user.email,
        phone: credential.user.phoneNumber || "",
        createdAt: new Date(),
        emailVerified: true
      });
    }
    router.push("/");
  };

  const handleAuthError = (err: any) => {
    let errorMessage = "An error occurred";
    
    switch (err.code) {
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
        errorMessage = err.message || "Authentication failed";
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
    } catch (err) {
      setError("Failed to resend verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                We've sent a verification link to <span className="font-medium">{email}</span>.
                Please click the link in that email to complete your registration.
              </p>
              
              <p className="text-sm text-gray-500">
                You'll be automatically redirected once verified. This may take a few seconds.
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
                  setLoading(true);
                  try {
                    if (auth.currentUser) {
                      await reload(auth.currentUser);
                      if (auth.currentUser.emailVerified) {
                        router.push('/');
                      } else {
                        setError("Email not verified yet. Please check your inbox.");
                      }
                    }
                  } catch (err) {
                    setError("Failed to check verification status.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-blue-600 hover:text-blue-500 font-medium text-sm"
              >
                I've verified my email - Refresh status
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
                  <Image 
                    src="/google-logo.png" 
                    alt="Google" 
                    width={20} 
                    height={20}
                    priority
                  />
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <PhoneInput
                      country={'in'}
                      value={phone}
                      onChange={setPhone}
                      inputClass="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      inputProps={{
                        required: true,
                        disabled: loading
                      }}
                    />
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </span>
                  ) : isLogin ? 'Sign In' : 'Create Account'}
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