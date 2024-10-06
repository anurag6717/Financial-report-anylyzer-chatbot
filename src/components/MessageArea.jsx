import React, { useState, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase.init";
import { addDoc, collection, serverTimestamp, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { IoCloseSharp } from "react-icons/io5";
import { useChat } from '../context/ChatContext';

const FAQDATA = [
  {
    corporate_information: [
      "What are the company's main products and services?",
      "Who are the company's key markets and customers?",
      "Who are the main competitors of the company?",
      "What are the company's key strategic initiatives for growth?",
      "What are the major risks and uncertainties facing the company's operations?",
      "What are the company's commitments to environmental, social, and governance (ESG) initiatives?",
    ],
  },
  {
    management_communication: [
      "What is the company's outlook for the coming year?",
      "What are the key highlights from the chairman's message?",
      "What are the chairman's priorities for the company moving forward?",
      "Does the chairman acknowledge any financial challenges faced by the company?",
      "What are the key strategic initiatives or goals outlined by the management in the annual report?",
      "What are the company's key performance indicators (KPIs) for measuring success?",
      "What is the management's approach to corporate governance and ethical practices?",
      "What risk mitigation strategies or actions has the company implemented to address the identified risks?",
      "What are the company's dividends policy and share price performance for the year?",
    ],
  },
  {
    statutory_reports: [
      "What type of audit opinion was issued on the financial statements (unmodified, modified, scope limitation)?",
      "What is included in the balance sheet, and what does it indicate about the company's financial position?",
      "What were the 'basis for opinion' and 'key audit matters' (if applicable) identified by the auditor?",
      "Did the auditor identify any significant risks or uncertainties?",
      "Are there any Key Audit Matters (KAMs) highlighted in the report?",
    ],
  },
  {
    financial_statements: [
      "What was the company's revenue and profit for the year?",
      "What was the company's net profit or loss for the year?",
      "Is cash cycle rising or falling?",
      "What is the company's total value of assets according to the annual report?",
      "Which asset items on the balance sheet are rising or falling?",
      "Did the company pay dividends to shareholders in fiscal year? If so, how much?",
      "What is the company's debt-to-equity ratio?",
      "Does the company have any outstanding loans? If so, what is the total amount?",
      "What were the company's total expenses for the past year?",
      "How do the company's expenses compare to its revenue?",
      "How do the financial statements compare to previous years, and what are the trends or changes observed?",
      "Did the company meet its financial targets outlined in the previous year's report?",
      "What are the main factors that impacted the company's financial performance?",
    ],
  },
];
const FAQModel = ({ showFAQQuestion, closeFaq,handleShowFAQQuestions, questions, handelSetQuestions, sendMessageToServer }) => {
  return (
    <div>
      <div className=" grid grid-cols-2 gap-2 py-2">
        <button
          onClick={() => {
            handelSetQuestions({
              type: "corporate_information",
              questions: FAQDATA[0].corporate_information
            })
            handleShowFAQQuestions()
          }}
          className={(questions?.type == "corporate_information" ? "bg-accent-500 text-white" : "bg-gray-200 text-black") + " cursor-pointer items-center justify-center rounded-lg  px-2 py-2 "} >
          Corporate Information
        </button>
        <button
          onClick={() => {
            handelSetQuestions({
              type: "management_communication",
              questions: FAQDATA[1].management_communication
            })
            handleShowFAQQuestions()
          }}
          className={(questions?.type == "management_communication" ? "bg-accent-500 text-white" : "bg-gray-200 text-black") + " cursor-pointer items-center justify-center rounded-lg  px-2 py-2 "} >
          Management Communication
        </button>
        <button
          onClick={() => {
            handelSetQuestions({
              type: "statutory_reports",
              questions: FAQDATA[2].statutory_reports
            })
            handleShowFAQQuestions()
          }}
          className={(questions?.type == "statutory_reports" ? "bg-accent-500 text-white" : "bg-gray-200 text-black") + " cursor-pointer items-center justify-center rounded-lg  px-2 py-2 "} >
          Statutory Reports
        </button>
        <button
          onClick={() => {
            handelSetQuestions({
              type: "financial_statements",
              questions: FAQDATA[3].financial_statements
            })
            handleShowFAQQuestions()
          }}
          className={(questions?.type == "financial_statements" ? "bg-accent-500 text-white" : "bg-gray-200 text-black") + " cursor-pointer items-center justify-center rounded-lg  px-2 py-2 "} >
          Financial Statements
        </button>
      </div>
      <div className="bg-accent-500 text-white p-3 rounded-lg mr-4 items-center">
        {showFAQQuestion && (
          questions.questions?.map((question, index) => {
            return (
              <span key={index}
                onClick={() => {
                  sendMessageToServer(question)
                  closeFaq()
                }}
                className="text-md cursor-pointer">
                <span className="inline-block items-center mr-1"><IoSend /></span>
                <span className="">{question}</span>
                <br />
              </span>
            )
          })
        )}
      </div>
    </div>

  )
}

const MessageArea = ({ handlePageNumber }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const { user } = useAuth();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showFAQQuestion, setShowFAQQuestion] = useState(false);
  const [questions, setQuestions] = useState({
    type: "corporate_information",
    questions: FAQDATA[0].corporate_information
  })
  const location = useLocation();
  useEffect(() => {
    if (!user) {
      return
    }
    const userRef = doc(db, 'users', user.uid);
    const userChatsRef = doc(userRef, 'chats', location.pathname.split("/")[2]);
    const chatMessagesRef = collection(userChatsRef, 'messages')
    // Create a query for all messages
    const allMessagesQuery = query(
      chatMessagesRef,
      orderBy('timestamp')
    );

    // Subscribe to the query and update messages on snapshot changes
    const unsubscribe = onSnapshot(allMessagesQuery, (snapshot) => {
      const newAllMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(newAllMessages);
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, [user, location]);

  useEffect(() => {
    const messageArea = document.getElementById("message-area");

    // Scroll to the bottom of the message area
    messageArea.scrollTop = messageArea.scrollHeight;
  }, [messages, showFAQ, showFAQQuestion, questions]);

  const closeFaq = () => {
    setShowFAQ(false);
  }
  const handelSetQuestions = (data) => {
    setQuestions(data)
  }

  const handleShowFAQQuestions = () => {
    setShowFAQQuestion(true);
  }
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const sendMessageToServer = async (query) => {
    setMsgLoading(true);
    try {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: query },
      ]);
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/generate`,
        { message: query, id: location.pathname.split("/")[2] }
      );
      const userRef = doc(db, 'users', user.uid);
      const userChatsRef = doc(userRef, 'chats', location.pathname.split("/")[2]);
      const chatMessagesRef = collection(userChatsRef, 'messages')
      await addDoc(chatMessagesRef, {
        user: query,
        bot: response.data.message,
        pages: response.data.pages,
        timestamp: serverTimestamp(),
      });
      setMessages((prevMessages) => [
        ...prevMessages,
        { bot: response.data.message, pages: response.data.pages },
      ]);

      console.log(response);
    } catch (error) {
      console.error("Error sending message to server:", error);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (userInput.trim() !== "") {
      sendMessageToServer(userInput);
      setUserInput("");
    }
  };
  const handleShowFAQ = () => {
    setShowFAQ(!showFAQ)
  }

  return (
    <div className="border  border-gray-300 rounded-lg p-5 relative overflow-hidden text-sm[17px]">
      <div id="message-area" className="space-y-4 flex-1 h-full overflow-y-auto pb-16 px-">
        {messages?.map((message, index) => {
          return (
            <div key={index} className="space-y-4">
              {
                message.intro &&
                <div className="flex justify-start">
                  <div className="bg-accent-500 w-[85%] text-white p-2 rounded-lg mr-4 flex items-center">
                    <div style={{ "whiteSpace": "pre-line" }}>
                      {message.intro}
                    </div>
                  </div>
                </div>
              }
              {
                message.user &&

                <div className="flex justify-end">
                  <div className="bg-gray-200 text-gray-800 p-2 rounded-lg ml-4 flex items-center">
                    <div>
                      {message.user}
                    </div>
                  </div>
                </div>
              }
              {message.bot &&
                <div className="flex justify-start">
                  <div className="bg-accent-500 w-[85%] text-white p-2 rounded-lg mr-4 flex items-center">
                    <div style={{ "whiteSpace": "pre-line" }}>
                      {message.bot}
                      <div className="flex"> Source:
                        {message.pages?.map((page, index) => {
                          return <div
                            onClick={() => handlePageNumber(page)}
                            className="cursor-pointer bg-white text-accent-500 rounded-md px-2 mr-2"
                            key={index}
                          > {page}
                          </div>
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          )
        })}
        {
          msgLoading && <div className="flex justify-start">
            <div className="bg-accent-500 space-x-2 text-white p-2 rounded-lg mr-4 flex items-center">
              <div className='h-3 w-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]'></div>
              <div className='h-3 w-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]'></div>
              <div className='h-3 w-3 bg-white rounded-full animate-bounce'></div>
            </div>
          </div>
        }
        {
          showFAQ && <FAQModel showFAQQuestion={showFAQQuestion} handleShowFAQQuestions={handleShowFAQQuestions} questions={questions} handelSetQuestions={handelSetQuestions} sendMessageToServer={sendMessageToServer} closeFaq={closeFaq}/>
        }

      </div>
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center bg-white p-4">
        <button
          className="absolute left-5 flex cursor-pointer items-center justify-center rounded-lg bg-accent-500 px-1 py-1 text-white"
          onClick={handleShowFAQ}
        >
          {!showFAQ ? "FAQ" : <IoCloseSharp size={24} />
          }
        </button>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          id="chat"
          className="bg-gray-50 ring-1 placeholder:pl-0 rounded-lg pl-12 border-gray-300 focus:outline-none outline-none text-gray-900 text-sm  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Ask Questions"
          required
        />
        <button
          onClick={handleSend}
          className="absolute right-5 flex cursor-pointer items-center justify-center rounded-lg bg-accent-500 px-3 py-2 text-white"
        >
          <IoSend />
        </button>
      </div>
    </div>
  );
};

export default MessageArea;
