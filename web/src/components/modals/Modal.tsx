import React from "react";

import { Icon } from "../icons";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = "max-w-lg" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`bg-zinc-950 border border-zinc-900 w-full rounded-3xl overflow-hidden shadow-2xl animate-fade-up ${className}`}>
                <div className="flex items-center justify-between p-6 border-b border-zinc-900">
                    <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};
