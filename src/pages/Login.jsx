import React from 'react';
import { supabase } from '../supabase/supabaseClient';

const Login = () => {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <div className="text-center p-10">
      <h2 className="text-2xl mb-4 font-heading text-dpblue">Sign in to Devil’s Purse</h2>
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
