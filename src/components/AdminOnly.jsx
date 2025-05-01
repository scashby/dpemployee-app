import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

const AdminOnly = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (user?.role === 'admin') {
        setIsAdmin(true);
      } else {
        navigate('/employee-dashboard');
      }
    };

    checkRole();
  }, [navigate]);

  if (isAdmin === null) return <p className="p-4">Checking admin status...</p>;
  return children;
};

export default AdminOnly;
