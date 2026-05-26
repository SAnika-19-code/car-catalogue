"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";

import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import Link from "next/link";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // FETCH COMPANIES
  const fetchCompanies = async () => {
    const snap = await getDocs(collection(db, "seat-covers"));

    setCompanies(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  };

  // AUTH CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (user) {
        setLoggedIn(true);
        await fetchCompanies();
      } else {
        setLoggedIn(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // LOGIN
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (err) {
      alert("Invalid email or password");
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
  };

  // ADD COMPANY
  const addCompany = async () => {
    if (!name) return;

    await setDoc(
      doc(db, "seat-covers", name.toLowerCase()),
      {
        name,
        images: [],
        trash: [],
      }
    );

    setName("");
    fetchCompanies();
  };

  // DELETE COMPANY
  const deleteCompany = async (c: any) => {
    const input = prompt(
      `Type "${c.name}" to confirm`
    );

    if (input !== c.name) return;

    await deleteDoc(doc(db, "seat-covers", c.id));

    fetchCompanies();
  };

  // LOADING
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  // LOGIN SCREEN
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md border border-zinc-800">

          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Companies Login
          </h1>

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 p-3 rounded bg-zinc-800 text-white outline-none"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-3 rounded bg-zinc-800 text-white outline-none"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            onClick={handleLogin}
            className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-gray-200 transition"
          >
            Login
          </button>

        </div>
      </div>
    );
  }

  // MAIN PAGE
  return (
    <div className="p-6 bg-black min-h-screen text-white">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Companies
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* ADD */}
      <div className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="p-2 bg-zinc-900 rounded"
          placeholder="Add company"
        />

        <button
          onClick={addCompany}
          className="bg-green-600 px-3 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {companies.map((c) => (
          <div
            key={c.id}
            className="bg-zinc-900 p-4 rounded flex justify-between items-center"
          >
            <Link
              href={`/admin/companies/${c.id}`}
            >
              <h2 className="capitalize hover:text-gray-300">
                {c.name}
              </h2>
            </Link>

            <button
              onClick={() => deleteCompany(c)}
              className="text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}