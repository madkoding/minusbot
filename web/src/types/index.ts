import type {
    User,
    SystemSettings,
    Settings,
    AIProvider,
    ChannelSchema,
    ChannelConfig,
    ChannelStatus,
    ChannelDetail,
    Stat,
    Skill,
    Integration,
    IntegrationsResponse,
    Tool,
    Message,
    ChatMeta,
    Chat
} from "@shared/types";

export type {
    User,
    SystemSettings,
    Settings,
    AIProvider,
    ChannelSchema,
    ChannelConfig,
    ChannelStatus,
    ChannelDetail,
    Stat,
    Skill,
    Integration,
    IntegrationsResponse,
    Tool,
    Message,
    ChatMeta,
    Chat
};

export interface Secret {
    id: string;
    name: string;
    description?: string;
    value?: string;
}
