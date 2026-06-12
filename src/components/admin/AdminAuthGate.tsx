"use client";

import { useEffect, useState } from "react";
import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/firebase/config";

type AdminAuthGateProps = {
  children: React.ReactNode;
};

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        const token = await getIdTokenResult(user, true);
        const isAdmin = token.claims.admin === true;
        setLoggedIn(isAdmin);

        if (!isAdmin) {
          setAuthError("This account does not have administrator access.");
          await signOut(auth);
        }
      } catch {
        setLoggedIn(false);
        setAuthError("Administrator access could not be verified.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setAuthError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setAuthError("Invalid email or password.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111a33] text-white">
        Loading...
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111a33] px-4">
        <div className="w-full max-w-md rounded-lg border border-[#d0ab4f]/25 bg-[#1d2a4b] p-8 shadow-2xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-[#d0ab4f]">
            Admin Login
          </h1>

          <input
            type="email"
            placeholder="Email"
            className="mb-4 w-full rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] p-3 text-white outline-none focus:border-[#d0ab4f]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="mb-4 w-full rounded-lg border border-[#d0ab4f]/25 bg-[#0b1020] p-3 text-white outline-none focus:border-[#d0ab4f]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="button"
            onClick={login}
            className="w-full rounded-lg bg-[#d0ab4f] py-3 font-semibold text-[#10182f] transition hover:bg-[#ead59a]"
          >
            Login
          </button>

          {authError && (
            <p role="alert" className="mt-4 text-center text-sm text-red-300">
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-20">
        <button
          type="button"
          onClick={() => void signOut(auth)}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
        >
          Logout
        </button>
      </div>
      {children}
    </>
  );
}
