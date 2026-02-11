import React from "react";
import { Card } from "../cards/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../stores/useAuthStore";

export const LoginForm: React.FC = () => {
    const { setAuth } = useAuthStore();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            const data = await authService.login({ username, password });
            setAuth(data.user, data.token);
        } catch (err: any) {
            setError(err.response?.data?.message || "Authentication invalid.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
            <div className="w-full max-sm:max-w-xs max-w-sm space-y-12 animate-fade-up">
                <div className="text-center space-y-4">
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-zinc-50/5 items-center justify-center mb-2 overflow-hidden border border-zinc-800/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Minusbot" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-100 uppercase italic">MINUSBOT</h1>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Your personal assistant</p>
                </div>

                <Card className="border-zinc-800/50 bg-zinc-900/20 backdrop-blur-2xl p-8 rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Username"
                            name="username"
                            placeholder="Enter username"
                            icon="user"
                            required
                            disabled={isLoading}
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            icon="lock"
                            required
                            disabled={isLoading}
                        />

                        {error && (
                            <p className="text-xs text-red-500 font-medium text-center">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl text-base font-bold tracking-tight"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Login'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};
