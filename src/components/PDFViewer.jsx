import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import "react-pdf/dist/esm/Page/TextLayer.css";
import { db, storage } from '../firebase/firebase.init';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext'
import { useLocation } from 'react-router-dom';
import { vectorizer } from '../utility/llmApi';
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";

// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


const PDFviewer = ({ pageNumber, handlePageNumber }) => {
  const [numPages, setNumPages] = useState();
  const { chats } = useChat()
  const location = useLocation();
  const { user } = useAuth();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [zoom, setZoom] = useState(400);
  const getPdfUrl = () => {
    if (chats.length == 0) {
      return
    }
    const currentChat = chats.filter((chat) => {
      return chat.chatId == location.pathname.split("/")[2]
    })

    const storageRef = ref(storage, `uploads/${user.uid}/${currentChat[0].chatId}/${currentChat[0].chatName}`);

    // Fetch the download URL
    getDownloadURL(storageRef)
      .then(async (downloadURL) => {
        vectorizer(downloadURL, currentChat[0].chatId)
        setPdfUrl(downloadURL)
      })
      .catch((error) => {
        console.error('Error getting download URL:', error.message);
      });
  }

  const handleZoomIn = () => {
    if(zoom<=800){
      setZoom(zoom+100)
    }
  }

  const handleZoomOut = () => {
    if(zoom>400){
      setZoom(zoom-100)
    }
  }

  const ResetZoom = () => {
    setZoom(400)
  }

  useEffect(() => {
    getPdfUrl()
    handlePageNumber(1)
  }, [user, location, chats])

  const file = useMemo(() => {
    if (!pdfUrl) {
      return null;
    }

    return {
      url: pdfUrl,
    };
  }, [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };



  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      handlePageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      handlePageNumber(pageNumber + 1);
    }
  };
  return (

    <div className='h-[100vh] p-4 flex flex-col  overflow-y-auto'>
      <div className="py-1 px-4 flex gap-4">
        <div className="flex items-start">
          <button onClick={goToPreviousPage}>
            &#10094;
          </button>
          <div>
            {pageNumber} / {numPages}
          </div>
          <button onClick={goToNextPage}>
            &#10095;
          </button>
        </div>
        <div className="flex space-x-2">
          <button
          onClick={handleZoomOut}
          >
            <FaMinus />
          </button>
          <button
          onClick={ResetZoom}
          >
            <GrPowerReset />
          </button>
          <button
          onClick={handleZoomIn}
          >
            <FaPlus />
          </button>
        </div>
      </div>
      {
        pdfUrl && (
          <>
            <div className="w-full items-center">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="h-[100vh] space-x-2 text-white p-2 rounded-lg flex items-center">
                    <div className='h-3 w-3 bg-accent-500 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                    <div className='h-3 w-3 bg-accent-500 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                    <div className='h-3 w-3 bg-accent-500 rounded-full animate-bounce'></div>
                  </div>
                }
                className="space-y-2"
              >

                <div
                  className='shadow-lg w-full'>


                  <Page
                    width={zoom}
                    loading=""
                    pageNumber={pageNumber}
                  />
                </div>
              </Document>

            </div>

          </>
        )
      }

    </div>
  );
};

export default PDFviewer;