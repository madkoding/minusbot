import React from "react";

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
    <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`}></div>
);
