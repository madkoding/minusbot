import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Icon } from '../icons/Icon';
import { apiClient } from '../../lib/apiClient';

interface FileItem {
    name: string;
    size: number;
    mtime: string;
    isDirectory: boolean;
}

interface ChatFilesModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId: string;
}

export function ChatFilesModal({ isOpen, onClose, chatId }: ChatFilesModalProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFiles = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/user/chats/${chatId}/files`);
            setFiles(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && chatId) {
            loadFiles();
        }
    }, [isOpen, chatId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('files', file);
        });

        try {
            await apiClient.post(`/user/chats/${chatId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            await loadFiles();
        } catch (e) {
            alert("Upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete ${filename}?`)) return;
        try {
            await apiClient.delete(`/user/chats/${chatId}/files/${filename}`);
            loadFiles();
        } catch (e) {
            alert("Delete failed");
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const response = await apiClient.get(`/user/chats/${chatId}/files/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Download failed");
        }
    };

    const handleRename = async (filename: string) => {
        const newName = prompt("New filename:", filename);
        if (!newName || newName === filename) return;
        try {
            await apiClient.put(`/user/chats/${chatId}/files/${filename}`, { newName });
            loadFiles();
        } catch (e) {
            alert("Rename failed");
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chat Files">
            <div className="space-y-4 min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-zinc-500 text-xs">Files in this chat context.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={loadFiles}
                            disabled={isLoading}
                            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <Icon name="rotate-cw" size={14} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <Button
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            loading={isUploading}
                            className="text-[10px] h-8"
                        >
                            <Icon name="upload" size={12} className="mr-2" />
                            Upload
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-zinc-950/50 rounded-xl border border-zinc-900">
                    {files.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 p-8">
                            <Icon name="file" size={32} className="mb-2 opacity-50" />
                            <span className="text-xs italic">No files yet.</span>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead className="text-[10px] font-black uppercase text-zinc-600 border-b border-zinc-900 bg-zinc-900/30 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3 w-20">Size</th>
                                    <th className="px-4 py-3 w-10 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50">
                                {files.map(file => (
                                    <tr key={file.name} className="group hover:bg-zinc-900/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-zinc-300 truncate max-w-[200px]" title={file.name}>
                                            <div className="flex items-center gap-2">
                                                <Icon name="file" size={14} className="text-zinc-600" />
                                                {file.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500 font-mono text-[10px]">{formatSize(file.size)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDownload(file.name)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-blue-400" title="Download">
                                                    <Icon name="download" size={12} />
                                                </button>
                                                <button onClick={() => handleRename(file.name)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-yellow-400" title="Rename">
                                                    <Icon name="edit-2" size={12} />
                                                </button>
                                                <button onClick={() => handleDelete(file.name)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400" title="Delete">
                                                    <Icon name="trash" size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Modal>
    );
}
