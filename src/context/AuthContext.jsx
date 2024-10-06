// authContext.js
import { createContext, useContext, useReducer } from 'react';
import authReducer from '../reducers/authReducer';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const initialState = {
    user: null,
  };


  const [state, dispatch] = useReducer(authReducer, initialState);

  const setUser = (user) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const clearUser = () => {
    dispatch({ type: 'CLEAR_USER' });
  };

  return (
    <AuthContext.Provider value={{ user: state.user, setUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
