import { useState } from 'react';
import MessageArea from './MessageArea'
import PDFviewer from './PDFViewer'


const Chat = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const handlePageNumber = (pageNumber) =>{
    setPageNumber(pageNumber)
    console.log(pageNumber);
  }

  return (
    <>
      <MessageArea  handlePageNumber={handlePageNumber}/>
      <PDFviewer pageNumber={pageNumber}  handlePageNumber={handlePageNumber}/>
    </>
  )
}

export default Chat