"use client";

import { useState } from "react";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Image from 'next/image'

type LoginProps = {
  onLogin: () => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (email === "admin@gmail.com" && password === "admin123") {
      onLogin();
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm p-8 bg-white/20 backdrop-blur-md rounded-lg shadow-lg">
        <div className="text-center">
          <Image
            alt="Logo"
            src="logo/png/logo1.png"
            width={500}
            height={500}
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Login
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email"
                className="block w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 pl-10 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <LockClosedIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="block w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 pl-10 placeholder-gray-500 focus:border-indigo-200 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
     
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              Sign in
            </button>
          </div>
        </form>
      
      </div>
    </div>
  );
}
