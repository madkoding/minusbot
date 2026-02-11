import React from "react";
import { Icon } from "../icons";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string;
    containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    className = "",
    containerClassName = "",
    ...props
}) => (
    <div className={`flex flex-col gap-2 w-full ${containerClassName}`}>
        {label && (
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                {label}
            </label>
        )}
        <div className="relative flex items-center group">
            {icon && (
                <div className="absolute left-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400">
                    <Icon name={icon} size={16} />
                </div>
            )}
            <input
                className={`flex h-11 w-full rounded-xl bg-zinc-900 border border-zinc-800 py-2 text-sm text-zinc-100 transition-all placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 outline-none disabled:opacity-50 ${icon ? 'pl-11 pr-4' : 'px-4'
                    } ${className}`}
                {...props}
            />
        </div>
    </div>
);
