import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    description,
    className = "",
    ...props
}) => (
    <div
        className={`bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm ${className}`}
        {...props}
    >
        {(title || description) && (
            <div className="mb-6">
                {title && <h3 className="text-lg font-bold text-zinc-100 tracking-tight">{title}</h3>}
                {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
            </div>
        )}
        {children}
    </div>
);
