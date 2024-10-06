import React, { useState, useEffect } from 'react';
import PdfUpload from './PdfUpload';

// icons
import { FaSignInAlt } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";

// login utility
import { signInWithGoogle, signOutUser, auth } from '../utility/firebaseauth'; // Import utility functions

//conetext
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

//lib 
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase.init';
import { Link, useLocation } from 'react-router-dom';


const Sidebar = () => {
  const { user, setUser, clearUser } = useAuth(); // Use the useAuth hook
  const { chats, setChats, loading } = useChat();
  const location = useLocation();
  const [isUserMenu, setIsUserMenu] = useState(false)
  const handleUserMenu = () => {
    setIsUserMenu(!isUserMenu);
  }
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe(); // Cleanup the subscription when the component unmounts
  }, []); // Empty dependency array to run the effect only once

  const fetchChats = async () => {
    console.log(loading);
    if (!user) {
      return
    }
    if(loading){
      return
    }
    try {
      const chatsCollection = collection(doc(db, 'users', user.uid), 'chats');
      const querySnapshot = await getDocs(chatsCollection);

      // Extract chat data from the query snapshot
      const chatsData = querySnapshot.docs.map((doc) => ({
        chatId: doc.id,
        ...doc.data(),
      }));

      // Update the chats state with the fetched data
      setChats(chatsData);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  useEffect(() => {
    // Fetch chats when the component mounts
    fetchChats();
  }, [user, loading]); // Empty dependency array ensures it only runs once on mount


  const handleGoogleSignIn = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      clearUser();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };


  return (
    <div className="bg-gray-800 text-white p-5 flex flex-col space-y-2">
      <PdfUpload
      />
      <div className="flex-1">
        <div className="flex flex-col gap-1">
          {
            chats?.map((chat) => {
              return (
                <div
                  key={chat.chatId}
                  className={"flex w-full cursor-pointer items-center gap-2 p-4 text-start leading-tight outline-none transition-all rounded-md hover:bg-gray-500 " + (location.pathname == `/chat/${chat.chatId}` ? "bg-accent-500" : "bg-transparent")}>
                  <Link to={`/chat/${chat.chatId}`}>
                    {chat.chatName}
                  </Link>
                </div>

              )
            })
          }

        </div>
      </div>
      <div>
        {
          user ?
            <div className="">
              {isUserMenu &&
                <ul
                  className="flex min-w-[180px] flex-col gap-2 overflow-auto rounded-md border border-blue-gray-50 bg-white p-3 font-sans text-sm font-normal text-blue-gray-500 shadow-lg shadow-blue-gray-500/10 focus:outline-none"
                >
                  <button
                    onClick={handleSignOut}
                    className="flex w-full cursor-pointer select-none items-center gap-2 rounded-md pt-[9px] pb-2 text-start leading-tight outline-none transition-all hover:bg-blue-gray-50 hover:bg-opacity-80 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900"
                  >
                    <FaSignInAlt className='text-black text-lg' />
                    <p className="block font-sans text-sm font-normal leading-normal text-black antialiased">
                      Sign Out
                    </p>
                  </button>
                </ul>
              }
              <div
                onClick={handleUserMenu}
                className='flex w-full cursor-pointer items-center gap-2 pt-[9px] pb-2 text-start leading-tight outline-none transition-all px-1 rounded-md hover:bg-gray-500'>
                <img
                  src={user?.photoURL}
                  className="relative inline-block h-10 w-10 cursor-pointer rounded-full object-cover object-center"
                />
                <p>{user?.displayName}</p>
              </div>
            </div>
            :
            <button
              onClick={handleGoogleSignIn}
              className='flex w-full cursor-pointer items-center gap-2 pt-[9px] pb-2 text-start leading-tight outline-none transition-all px-2 rounded-md hover:bg-gray-500'>
              <FaSignOutAlt
                className='text-white text-lg'
              />
              Sign in
            </button>
        }



      </div>
    </div>
  );
};

export default Sidebar;
