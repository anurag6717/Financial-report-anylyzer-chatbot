// chatContext.js
import React, { createContext, useReducer, useContext } from 'react';

// Action types
const SET_CHATS = 'SET_CHATS';
const ADD_CHAT = 'ADD_CHAT';
const SET_LOADING = 'SET_LOADING';
// Initial state
const initialState = {
  chats: [],
  loading: false,
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case SET_CHATS:
      return { ...state, chats: action.payload };
    case ADD_CHAT:
      return { ...state, chats: [...state.chats, action.payload]};
    case SET_LOADING:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Context provider
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const setChats = (chats) => {
    dispatch({ type: SET_CHATS, payload: chats });
  };

  const addChat = (chat) => {
    dispatch({ type: ADD_CHAT, payload: chat });
  };

  const setLoading = (isLoading) => {
    dispatch({ type: SET_LOADING, payload: isLoading });
  };

  return (
    <ChatContext.Provider value={{ chats: state.chats, loading: state.loading, setChats, addChat, setLoading }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
