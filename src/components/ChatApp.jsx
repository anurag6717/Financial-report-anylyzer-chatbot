import React, { useState, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import axios from "axios";
import { FaRobot, FaUser } from "react-icons/fa";

const Chat = ({ selectedFile }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  // console.log(messages);

  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const sendMessageToServer = async () => {
    setLoading(true);
    try {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: userInput, type: "user" },
      ]);
      const response = await axios.post( // here I have to pase url till /api/generate
        "https://774f-34-143-143-177.ngrok-free.app//api/generate", 
        { message: userInput, file: selectedFile.name }
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response.data.message, type: "bot" },
      ]);

      console.log(response);
    } catch (error) {
      console.error("Error sending message to server:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (userInput.trim() !== "") {
      sendMessageToServer();
      setUserInput("");
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-5 relative overflow-hidden">
      <div class="space-y-4 flex-1 h-full overflow-y-auto pb-16">
        {console.log(messages)}
        {messages?.map((message) => {
          return (
            message.type == "user" ?
              (
                <div className="flex justify-end">
                  <div className="bg-gray-200 text-gray-800 p-2 rounded-lg ml-4 flex items-center">
                    <div>
                      {message.text}
                    </div>
                  </div>
                </div>
              )
              :
              (
                <div className="flex justify-start">
                  <div className="bg-accent-500 text-white p-2 rounded-lg mr-4 flex items-center">
                    <div>
                      {message.text}
                    </div>
                  </div>
                </div>
              )
          )
        })}
        {
          loading && <div className="flex justify-start">
            <div className="bg-accent-500 space-x-2 text-white p-2 rounded-lg mr-4 flex items-center">
              <div class='h-3 w-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]'></div>
              <div class='h-3 w-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]'></div>
              <div class='h-3 w-3 bg-white rounded-full animate-bounce'></div>
            </div>
          </div>
        }
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center bg-white p-4">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          id="chat"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-l-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Ask Questions"
          required
        />
        <button
          onClick={handleSend}
          className="flex cursor-pointer items-center justify-center rounded-r-md bg-accent-500 px-5 py-3 text-white"
        >
          <IoSend />
        </button>
      </div>
    </div>
  );
};

export default Chat;

