import React from "react";
import { Outlet } from "react-router-dom";
import BrokerSidebar from "../components/BrokerSidebar";

const BrokerLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <BrokerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrokerLayout;
