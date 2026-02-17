import React, { useEffect, useState, useRef } from 'react';
import type { Command, CommandSub, CommandArg } from '../hooks/useCommands';

interface CommandAutocompleteProps {
    input: string;
    commands: Command[];
    onSelect: (completion: string) => void;
}

interface Suggestion {
    type: 'command' | 'subcommand' | 'arg';
    text: string;
    description: string;
    completion: string;
    isArg?: boolean; // If true, selection won't prevent submission entirely, just hints
}

export function CommandAutocomplete({ input, commands, onSelect }: CommandAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!input.startsWith('/')) {
            setSuggestions([]);
            return;
        }

        const parts = input.slice(1).split(' ');
        const newSuggestions: Suggestion[] = [];

        if (parts.length === 1) {
            // Suggest commands
            const query = parts[0].toLowerCase();
            commands
                .filter(cmd => cmd.name.toLowerCase().startsWith(query))
                .forEach(cmd => {
                    newSuggestions.push({
                        type: 'command',
                        text: `/${cmd.name}`,
                        description: cmd.description,
                        completion: `/${cmd.name}`
                    });
                });
        } else {
            // Suggest subcommands or args
            const cmdName = parts[0];
            const command = commands.find(c => c.name.toLowerCase() === cmdName.toLowerCase());

            if (command) {
                const subQuery = parts[parts.length - 1].toLowerCase();

                // Check if we should suggest subcommands
                if (command.subs.length > 0 && parts.length === 2) {
                    command.subs
                        .filter(sub => sub.name.toLowerCase().startsWith(subQuery))
                        .forEach(sub => {
                            newSuggestions.push({
                                type: 'subcommand',
                                text: sub.name,
                                description: sub.description,
                                completion: `/${cmdName} ${sub.name}`
                            });
                        });
                }

                // Suggest arguments (These are basically info cards)
                const relevantArgs = parts.length === 2 && command.subs.length > 0
                    ? command.subs.find(s => s.name.toLowerCase() === parts[1].toLowerCase())?.args || []
                    : command.args;

                const currentArgIndex = parts.length - (command.subs.length > 0 ? 3 : 2);
                if (currentArgIndex >= 0 && currentArgIndex < relevantArgs.length) {
                    const arg = relevantArgs[currentArgIndex];
                    newSuggestions.push({
                        type: 'arg',
                        text: `${arg.name}:`,
                        description: `${arg.type}${arg.required ? ' (required)' : ' (optional)'} - ${arg.description}`,
                        completion: input, // Argument suggestions don't change input when "selected" in this context usually, unless we want to autocomplete enum values
                        isArg: true
                    });
                }
            }
        }

        setSuggestions(newSuggestions);
        setSelectedIndex(-1);
    }, [input, commands]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (suggestions.length === 0) return;

            const currentSuggestion = selectedIndex >= 0 ? suggestions[selectedIndex] : null;
            const isArgHint = currentSuggestion?.isArg;
            const isNavKey = e.key === 'ArrowDown' || e.key === 'ArrowUp';
            const isSelectKey = e.key === 'Tab' || e.key === 'Enter';

            if (isNavKey) {
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'ArrowDown') {
                    setSelectedIndex(prev => prev === -1 ? 0 : (prev + 1) % suggestions.length);
                } else {
                    setSelectedIndex(prev => prev === -1 ? suggestions.length - 1 : (prev - 1 + suggestions.length) % suggestions.length);
                }
            } else if (isSelectKey) {
                if (currentSuggestion && !isArgHint) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(currentSuggestion.completion);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [suggestions, selectedIndex, onSelect]);

    if (suggestions.length === 0) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-4 z-50">
            <div className="bg-zinc-900/95 border border-zinc-800/50 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[300px]">
                <div ref={listRef} className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className={`px-4 py-3 rounded-xl cursor-pointer transition-all ${index === selectedIndex
                                ? 'bg-zinc-800/80 border border-zinc-700/50'
                                : 'hover:bg-zinc-800/40'
                                }`}
                            onClick={() => !suggestion.isArg && onSelect(suggestion.completion)}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${suggestion.type === 'command' ? 'bg-blue-500' :
                                    suggestion.type === 'subcommand' ? 'bg-purple-500' :
                                        'bg-green-500'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-zinc-100 mb-1">
                                        {suggestion.text}
                                    </div>
                                    <div className="text-xs text-zinc-500 leading-relaxed">
                                        {suggestion.description}
                                    </div>
                                </div>
                                {index === selectedIndex && !suggestion.isArg && (
                                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                                        Tab
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 py-2 bg-zinc-950/50 border-t border-zinc-800/30 text-[10px] text-zinc-600 font-medium flex items-center gap-4 flex-shrink-0">
                    <span>↑↓ Navigate</span>
                    <span>Tab/Enter Select</span>
                    <span>Esc Cancel</span>
                </div>
            </div>
        </div>
    );
}
