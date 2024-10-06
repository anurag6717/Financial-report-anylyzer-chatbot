// Layout.js
import React from 'react';

const Layout = ({ children }) => {
    return (
        <main className="mx-auto grid h-[100vh] w-[100vw] md:grid-cols-[15%_50%_35%]">
            {children}
        </main>
      );
};

export default Layout;
