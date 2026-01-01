"use client";

import React, { useState, useEffect } from "react";
import CreateAnimalForm from "./Components/CreateAnimalForm";
import SectionsManager from "./Components/SectionsManager";
import FAQsManager from "./Components/FAQsManager";
import { api } from "@/lib/api";
// import router from "next/router";
import Swal from "sweetalert2";
import { VERDE_PRINCIPAL, CASI_NEGRO, BLANCO_HUESO } from "@/Constants/colors";
import { useAuthStore } from "../store/auth.store";

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const LOCK_KEY = "admin_lock_until";
const ATTEMPTS_KEY = "admin_bad_attempts";

export default function AdminPage() {
    const { login: storeLogin, isAuthenticated: storeIsAuthenticated } = useAuthStore();
    const [sk, setSk] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Load lock state and bad attempts from localStorage
    const [badAttempts, setBadAttempts] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(ATTEMPTS_KEY);
            return stored ? parseInt(stored, 10) : 0;
        }
        return 0;
    });
    const [lockedUntil, setLockedUntil] = useState<number | null>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(LOCK_KEY);
            return stored ? parseInt(stored, 10) : null;
        }
        return null;
    });
    const [now, setNow] = useState(Date.now());
    const [loading, setLoading] = useState(false);
    // const [isAuthenticated, setIsAuthenticated] = useState(false); // Removed local state
    const isAuthenticated = storeIsAuthenticated(); // Use store state
    const [activeTab, setActiveTab] = useState<'animals' | 'sections' | 'faqs'>('animals');

    // Sync localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedAttempts = localStorage.getItem(ATTEMPTS_KEY);
            const storedLock = localStorage.getItem(LOCK_KEY);
            if (storedAttempts) setBadAttempts(parseInt(storedAttempts, 10));
            if (storedLock) setLockedUntil(parseInt(storedLock, 10));
        }
    }, []);

    // Save to localStorage whenever badAttempts change
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(ATTEMPTS_KEY, badAttempts.toString());
        }
    }, [badAttempts]);

    // Save to localStorage whenever lockedUntil changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (lockedUntil !== null) {
                localStorage.setItem(LOCK_KEY, lockedUntil.toString());
            } else {
                localStorage.removeItem(LOCK_KEY);
            }
        }
    }, [lockedUntil]);

    // Update now
    useEffect(() => {
        if (!lockedUntil) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    // Lockout expiry
    useEffect(() => {
        if (lockedUntil && now >= lockedUntil) {
            setBadAttempts(0);
            setLockedUntil(null);
            setError(null);
            if (typeof window !== "undefined") {
                localStorage.removeItem(ATTEMPTS_KEY);
                localStorage.removeItem(LOCK_KEY);
            }
        }
    }, [now, lockedUntil]);

    const isLocked = !!lockedUntil && now < lockedUntil;

    /**
     * Login function
     */
    const login = async (
        sk: string,
        email: string,
        password: string
    ): Promise<boolean> => {
        try {
            const resp = await api.post("/users/login", { sk, email, password });
            if (resp.status === 200 && resp.data.success) {
                const { access_token, ...userData } = resp.data.data;
                storeLogin(access_token, userData);

                Swal.fire({
                    title: "Login successful",
                    text: "You are now logged in.",
                    icon: "success",
                });
                return true;
            } else {
                console.error("Login failed response:", resp);
                Swal.fire({
                    title: "Login failed",
                    text: "Invalid credentials. Please try again.",
                    icon: "error",
                });
                return false;
            }
        } catch (err) {
            console.error("Login error:", err);
            Swal.fire({
                title: "Login failed",
                text: "Invalid credentials. Please try again.",
                icon: "error",
            });
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isLocked || loading) return;

        if (!sk.trim() || !email.trim() || !password.trim()) {
            setError("All fields are required.");
            return;
        }

        setLoading(true);
        const isAuth = await login(sk, email, password);
        setLoading(false);

        if (!isAuth) {
            const tries = badAttempts + 1;
            setBadAttempts(tries);
            if (tries >= 5) {
                const lockUntil = Date.now() + LOCK_DURATION_MS;
                setLockedUntil(lockUntil);
                setError(
                    "Too many failed attempts. Please try again in 5 minutes."
                );
            } else {
                setError("Invalid credentials. Please try again.");
            }
            return;
        }

        // Reset on success
        setBadAttempts(0);
        setLockedUntil(null);
        setError(null);
        // setIsAuthenticated(true); // Handled by store
        if (typeof window !== "undefined") {
            localStorage.removeItem(ATTEMPTS_KEY);
            localStorage.removeItem(LOCK_KEY);
        }
    };

    const getLockoutMessage = () => {
        if (!lockedUntil) return null;
        const remaining = Math.max(0, lockedUntil - now);
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        return `You have been blocked due to too many attempts. Try again in ${min}:${sec
            .toString()
            .padStart(2, "0")} minutes.`;
    };

    const handleLogout = () => {
        // setIsAuthenticated(false);
        const { logout } = useAuthStore.getState();
        logout();
        setSk('');
        setEmail('');
        setPassword('');
        setError(null);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        Login
                    </h1>
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <input
                            type="password"
                            required
                            placeholder="SK"
                            value={sk}
                            disabled={isLocked || loading}
                            onChange={(e) => setSk(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                        />
                        <input
                            type="text"
                            required
                            placeholder="Email"
                            value={email}
                            disabled={isLocked || loading}
                            onChange={(e) => setEmail(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                        />
                        <input
                            type="password"
                            required
                            placeholder="Password"
                            value={password}
                            disabled={isLocked || loading}
                            onChange={(e) => setPassword(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                        />
                        <button
                            type="submit"
                            disabled={isLocked || loading}
                            className={`bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition ${isLocked || loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                    {error && (
                        <div className="mt-4 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}
                    {isLocked && (
                        <div className="mt-2 text-yellow-700 text-xs text-center">
                            {getLockoutMessage()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: BLANCO_HUESO }}>
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold" style={{ color: CASI_NEGRO }}>
                        Panel de Administración
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition-colors"
                        style={{ color: CASI_NEGRO }}
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6">
                    <button
                        onClick={() => setActiveTab('animals')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'animals'
                            ? 'text-white'
                            : 'border border-zinc-300 hover:bg-zinc-50'
                            }`}
                        style={{
                            backgroundColor: activeTab === 'animals' ? VERDE_PRINCIPAL : 'transparent',
                            color: activeTab === 'animals' ? 'white' : CASI_NEGRO
                        }}
                    >
                        Gestión de Animales
                    </button>
                    <button
                        onClick={() => setActiveTab('sections')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'sections'
                            ? 'text-white'
                            : 'border border-zinc-300 hover:bg-zinc-50'
                            }`}
                        style={{
                            backgroundColor: activeTab === 'sections' ? VERDE_PRINCIPAL : 'transparent',
                            color: activeTab === 'sections' ? 'white' : CASI_NEGRO
                        }}
                    >
                        Secciones del Home
                    </button>
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'faqs'
                            ? 'text-white'
                            : 'border border-zinc-300 hover:bg-zinc-50'
                            }`}
                        style={{
                            backgroundColor: activeTab === 'faqs' ? VERDE_PRINCIPAL : 'transparent',
                            color: activeTab === 'faqs' ? 'white' : CASI_NEGRO
                        }}
                    >
                        FAQs
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'animals' && <CreateAnimalForm />}
                    {activeTab === 'sections' && <SectionsManager />}
                    {activeTab === 'faqs' && <FAQsManager />}
                </div>
            </div>
        </div>
    );
}