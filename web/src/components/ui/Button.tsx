import { Icon } from "../icons";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    size = 'md',
    loading = false,
    ...props
}) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] ";

    const variants = {
        primary: "bg-zinc-50 text-zinc-950 hover:bg-zinc-200",
        secondary: "border border-zinc-800 bg-zinc-900/50 text-zinc-100 hover:bg-zinc-800",
        danger: "bg-red-600 text-zinc-50 hover:bg-red-500",
        ghost: "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-50"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-8 py-2 text-base"
    };

    return (
        <button
            onClick={onClick}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={props.disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <Icon name="loader" size={16} className="animate-spin" />
                    <span>{children}</span>
                </div>
            ) : children}
        </button>
    );
};
