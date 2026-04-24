import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

const mapUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
    email: supabaseUser.email,
    photo: supabaseUser.user_metadata?.avatar_url || '',
    providers: supabaseUser.app_metadata?.providers || []
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapUser(session?.user));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = async (name, email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      if (error) throw error;
      
      if (data.user && data.session === null) {
          return { success: true, message: 'Please check your email for a confirmation link.' };
      }
      
      setUser(mapUser(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Attempt to check if email exists using our custom RPC
        const { data: exists, error: rpcError } = await supabase.rpc('check_email_exists', { lookup_email: email });
        
        if (!rpcError && exists === false) {
          throw new Error('Email not registered. Please sign up first.');
        } else if (rpcError) {
          // If they haven't run the SQL snippet yet, fallback to a standard message
          throw new Error('Incorrect email or password.');
        } else {
          throw new Error('Incorrect email or password.');
        }
      }
      
      setUser(mapUser(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signInWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updateName = async (name) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      if (error) throw error;
      setUser(mapUser(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const linkAccount = async (provider) => {
    try {
      const providerMap = {
        'google.com': 'google',
        'microsoft.com': 'azure',
        'apple.com': 'apple'
      };
      
      const { data, error } = await supabase.auth.linkIdentity({
        provider: providerMap[provider] || provider.split('.')[0]
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const deleteAccount = async () => {
    if (!user) return { success: false, message: 'No user is logged in.' };
    
    try {
      const userId = user.id;
      
      // 1. Delete all user data from custom tables
      await Promise.all([
        supabase.from('expenses').delete().eq('user_id', userId),
        supabase.from('recurring').delete().eq('user_id', userId)
      ]);

      // 2. Call the SQL function to delete the Auth account
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;

      // 3. Clear local storage and log out
      localStorage.removeItem(`trackit-expenses-${userId}`);
      localStorage.removeItem(`trackit-recurring-${userId}`);
      
      await logout();
      return { success: true };
    } catch (error) {
      console.error("Deletion error:", error);
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, signup, signin, signInWithGoogle, signInWithMicrosoft, signInWithApple, logout, deleteAccount, isAuthenticated: !!user, loading, updateName, linkAccount, updatePassword 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
