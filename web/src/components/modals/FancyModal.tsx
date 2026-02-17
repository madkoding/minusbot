import React, { type FC } from "react";

interface FancyModalProps {
    isOpen: boolean;
    title: string;
    status?: "info" | "success" | "error" | "warning";
    children: React.ReactNode;
}

const statusColors = {
    info: "bg-blue-500",
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warning: "bg-amber-500",
    default: "bg-pink-500"
};

export const FancyModal: FC<FancyModalProps> = ({ isOpen, title, status, children }) => {
    if (!isOpen) return null;

    const barColor = status ? statusColors[status] : statusColors.default;
    const separator = " · ";
    const repeatedTitle = Array(10).fill(title).join(separator) + separator;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">

            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl animate-fade-up flex flex-col max-h-[90vh] relative z-20">

                <div className={`h-8 ${barColor} overflow-hidden relative flex items-center select-none shrink-0 w-full`}>
                    <div className="flex animate-marquee w-max">
                        <span className="whitespace-nowrap px-4 font-black text-xs uppercase tracking-[0.2em] text-zinc-950">
                            {repeatedTitle}
                        </span>
                        <span className="whitespace-nowrap px-4 font-black text-xs uppercase tracking-[0.2em] text-zinc-950">
                            {repeatedTitle}
                        </span>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative">
                    {children}
                </div>
            </div>
        </div>
    );
};
