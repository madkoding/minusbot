import { getGlobalSettings } from "./config";

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",

    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m",
        pink: "\x1b[38;5;213m",
        purple: "\x1b[38;5;141m"
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        pink: "\x1b[48;5;213m",
        purple: "\x1b[48;5;141m"
    }
};

export class Logger {
    private static async wrap(text: string, style: string): Promise<string> {
        const settings = await getGlobalSettings();
        if (!settings.colors) return text;
        return `${style}${text}${COLORS.reset}`;
    }

    static async banner(version: string) {
        const art = `
  __  __ _                  _           _   
 |  \\/  (_)_ __  _   _ ___ | |__   ___ | |_ 
 | |\\/| | | '_ \\| | | / __|| '_ \\ / _ \\| __|
 | |  | | | | | | |_| \\__ \\| |_) | (_) | |_ 
 |_|  |_|_|_| |_|\\__,_|___/|_.__/ \___/ \\__|
                                      v${version}
        `;
        console.log(await this.wrap(art, COLORS.fg.blue + COLORS.bright));
    }

    static async bot(text: string) {
        const tag = await this.wrap(" ⚙ MINUS ", COLORS.bg.blue + COLORS.fg.white + COLORS.bright);
        const sep = await this.wrap(" » ", COLORS.fg.blue + COLORS.bright);
        console.log(`${tag}${sep}${await this.wrap(text, COLORS.fg.white)}\n`);
    }

    static async system(text: string) {
        const tag = await this.wrap(" ⚙ SYSTEM ", COLORS.bg.magenta + COLORS.fg.white + COLORS.bright);
        const sep = await this.wrap(" » ", COLORS.fg.magenta + COLORS.bright);
        console.log(`${tag}${sep}${await this.wrap(text, COLORS.fg.gray)}\n`);
    }

    static async task(text: string) {
        const tag = await this.wrap(" 󱙺 TASK ", COLORS.bg.pink + COLORS.fg.white + COLORS.bright);
        const sep = await this.wrap(" » ", COLORS.fg.pink + COLORS.bright);
        console.log(`${tag}${sep}${await this.wrap(text, COLORS.fg.pink)}`);
    }

    static async skill(text: string) {
        const tag = await this.wrap(" 󰚚 SKLL ", COLORS.bg.purple + COLORS.fg.white + COLORS.bright);
        const sep = await this.wrap(" » ", COLORS.fg.purple + COLORS.bright);
        console.log(`${tag}${sep}${await this.wrap(text, COLORS.fg.purple)}`);
    }

    static async error(text: string) {
        const tag = await this.wrap(" ✖ CRIT ", COLORS.bg.red + COLORS.fg.white + COLORS.bright);
        console.log(`${tag} ${await this.wrap(text, COLORS.fg.red)}`);
    }

    static async warn(text: string) {
        const tag = await this.wrap(" ⚠ WARN ", COLORS.bg.yellow + COLORS.fg.black + COLORS.bright);
        console.log(`${tag} ${await this.wrap(text, COLORS.fg.yellow)}`);
    }

    static async success(text: string) {
        const tag = await this.wrap(" ✔  OK  ", COLORS.bg.green + COLORS.fg.black + COLORS.bright);
        console.log(`${tag} ${await this.wrap(text, COLORS.fg.green)}`);
    }

    static async info(text: string) {
        const tag = await this.wrap(" ℹ INFO ", COLORS.bg.cyan + COLORS.fg.black + COLORS.bright);
        console.log(`${tag} ${await this.wrap(text, COLORS.fg.cyan)}`);
    }

    static async prompt(): Promise<string> {
        return await this.wrap(" ❯ ", COLORS.fg.green + COLORS.bright);
    }

    static async stream(text: string) {
        process.stdout.write(text);
    }

    static async tool(name: string, args: any) {
        const tag = await this.wrap(" ⚙ SYSTEM ", COLORS.bg.magenta + COLORS.fg.white + COLORS.bright);
        const sep = await this.wrap(" » ", COLORS.fg.magenta + COLORS.bright);
        const argStr = JSON.stringify(args);
        console.log(`${tag}${sep}Using tool: ${name} ${await this.wrap(argStr, COLORS.fg.gray)}`);
    }

}
