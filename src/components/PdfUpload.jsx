import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from '../context/AuthContext'; // Import your AuthContext hook
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../firebase/firebase.init';
import { collection, addDoc, doc } from 'firebase/firestore';
import { useChat } from '../context/ChatContext';
import { useNavigate } from "react-router-dom";
import { intro } from '../utility/llmApi';

const PdfUpload = () => {
  const { user } = useAuth();
  const { addChat, setLoading, loading } = useChat();
  const [uploadLoading, seUploadLoading] = useState();
  const navigate = useNavigate()


  const handleFileChange = async (file) => {
    if (!user) {
      return
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const userChatsRef = collection(userRef, 'chats');

      const chatRef = await addDoc(userChatsRef, {
        chatName: file.name,
      });
      seUploadLoading(true)
      setLoading(true)
      addChat({
        chatId: chatRef.id,
        chatName: file.name,
      })

      const storageRef = ref(storage, `uploads/${user.uid}/${chatRef.id}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error('Error uploading file:', error.message);
        },
        async () => {
          // Upload complete, but we are not fetching the download URL in this example
          console.log('Upload complete');
          await intro(file, chatRef.id, user.uid)
          seUploadLoading(false)  
          setLoading(false)
          navigate(`/chat/${chatRef.id}`)
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error.message);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    handleFileChange(file);
  }, [handleFileChange]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: [".pdf"], // Limit accepted file types to PDFs
  });
  return (
    <div className="py-4 px-4 border-2 border-blue-600 border-dashed">
      <div {...getRootProps()} className="flex items-center justify-center">
        <input {...getInputProps()} />
        {!uploadLoading ? (
          <p className="text-center text-lg">New Chat</p>
        ) : (
          <div className="space-x-2 text-white flex items-center">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
            <p>Processing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfUpload;
