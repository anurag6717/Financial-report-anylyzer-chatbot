import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

//pages and components
import React from 'react';
import Chat from './components/Chat';
import Sidebar from './components/SideBar';
import Layout from './components/Layout';
import Home from './components/Home';


const App = () => {




  return (
    <>
      <Layout>
        <Sidebar />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/chat/:id" element={<Chat />} />
        </Routes>
      </Layout>
    </>
  );
};

export default App;