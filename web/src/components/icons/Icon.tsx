import React from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface IconProps extends Omit<LucideProps, 'ref'> {
    name: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, className = "", ...props }) => {
    const icons: Record<string, React.FC<LucideProps>> = {
        dashboard: LucideIcons.LayoutDashboard,
        chat: LucideIcons.MessageCircle,
        users: LucideIcons.Users,
        vault: LucideIcons.Lock,
        settings: LucideIcons.Settings,
        plus: LucideIcons.Plus,
        trash: LucideIcons.Trash2,
        logout: LucideIcons.LogOut,
        send: LucideIcons.Send,
        chat_alt: LucideIcons.MessageSquare,
        globe: LucideIcons.Globe,
        search: LucideIcons.Search,
        user: LucideIcons.User,
        shield: LucideIcons.Shield,
        terminal: LucideIcons.Terminal,
        x: LucideIcons.X,
        check: LucideIcons.Check,
        circle: LucideIcons.Circle,
        loader: LucideIcons.Loader2,
        info: LucideIcons.Info,
        lock: LucideIcons.Lock,
        key: LucideIcons.Key,
        cpu: LucideIcons.Cpu,
        eye: LucideIcons.Eye,
        image: LucideIcons.Image,
        "volume-2": LucideIcons.Volume2,
        mic: LucideIcons.Mic,
        "edit-2": LucideIcons.Edit2,
        "trash-2": LucideIcons.Trash2,
        "message-square": LucideIcons.MessageSquare,
    };

    const LucideIcon = icons[name];

    if (!LucideIcon) {
        // Fallback or try to find by camelCase if name is passed as such
        // @ts-ignore
        const DynamicIcon = LucideIcons[name.charAt(0).toUpperCase() + name.slice(1)] || LucideIcons.HelpCircle;
        return <DynamicIcon size={size} className={className} {...props} />;
    }

    return <LucideIcon size={size} className={className} {...props} />;
};
