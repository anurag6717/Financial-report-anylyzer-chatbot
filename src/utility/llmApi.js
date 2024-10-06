import axios from 'axios';
import { db } from "../firebase/firebase.init";
import { addDoc, collection, serverTimestamp, doc } from "firebase/firestore";

export const vectorizer = (url, id) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL + "/api/vectorizer";
  axios.post(apiUrl, {
    url: url,
    id: id,
  })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(error);
    })
}

export const intro = async (file, id, uid) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('id', id);
  try {
    const response = await axios.post(import.meta.env.VITE_API_BASE_URL + '/intro', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const userRef = doc(db, 'users', uid);
    const userChatsRef = doc(userRef, 'chats', id);
    const chatMessagesRef = collection(userChatsRef, 'messages')
    await addDoc(chatMessagesRef, {
      intro: response.data.Intro,
      timestamp: serverTimestamp(),
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};
