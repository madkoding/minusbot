import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export interface CommandArg {
    name: string;
    description: string;
    type: string;
    required?: boolean;
}

export interface CommandSub {
    name: string;
    description: string;
    args: CommandArg[];
}

export interface Command {
    name: string;
    description: string;
    usage?: string;
    args: CommandArg[];
    subs: CommandSub[];
}

export function useCommands() {
    const [commands, setCommands] = useState<Command[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCommands();
    }, []);

    const fetchCommands = async () => {
        try {
            const response = await apiClient.get('/user/commands');
            setCommands(response.data);
        } catch (error) {
            console.error('Failed to fetch commands:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return { commands, isLoading };
}
