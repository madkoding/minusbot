import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "../navigation/Sidebar";
import { useAuthStore } from "../../stores/useAuthStore";

export const DashboardLayout: React.FC = () => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex bg-[#070707] h-screen overflow-hidden">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
