import React from "react";
import { Icon } from "../icons";
import { useUIStore } from "../../stores/useUIStore";

interface MobileHeaderProps {
    title: string;
    actions?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, actions }) => {
    const { setIsMobileMenuOpen } = useUIStore();

    return (
        <header className="lg:hidden flex-shrink-0 h-16 border-b border-zinc-900 bg-[#070707]/50 backdrop-blur-xl px-4 flex items-center justify-between z-10 w-full">
            <div className="flex items-center w-20">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                    <Icon name="menu" size={24} />
                </button>
            </div>

            <div className="flex-1 flex justify-center min-w-0">
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest truncate px-2">
                    {title}
                </h2>
            </div>

            <div className="flex items-center justify-end w-20">
                {actions}
            </div>
        </header>
    );
};
