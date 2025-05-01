import React from 'react';
import { supabase } from '../supabase/supabaseClient';

const Login = () => {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dpbg text-dpblue font-body">
      <h2 className="text-2xl font-heading mb-2">Sign in to Devil’s Purse</h2>
      <p className="mb-6 text-sm">Employee access portal</p>
      <button
        onClick={handleLogin}
        className="bg-dpblue text-white px-6 py-2 rounded hover:bg-dpgold transition"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
