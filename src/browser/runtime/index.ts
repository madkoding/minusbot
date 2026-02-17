import { chromium, type Page } from 'playwright';

interface SimplifiedElement {
    tag: string;
    text: string;
    id?: string | null;
    class?: string | null;
    role?: string | null;
    placeholder?: string | null;
    type?: string | null;
}

async function simplifyDOM(page: Page): Promise<SimplifiedElement[]> {
    return await page.evaluate(() => {
        const elements: SimplifiedElement[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);

        let node: Node | null;
        while (node = walker.nextNode()) {
            const el = node as HTMLElement;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;

            const isInteractive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) ||
                el.getAttribute('role') === 'button' ||
                (el as any).onclick != null;

            if (isInteractive) {
                elements.push({
                    tag: el.tagName.toLowerCase(),
                    text: el.innerText.trim().substring(0, 50),
                    id: el.id || null,
                    class: el.className || null,
                    role: el.getAttribute('role'),
                    placeholder: (el as HTMLInputElement).placeholder || null,
                    type: (el as HTMLInputElement).type || null
                });
            } else if (el.tagName.startsWith('H') || (el.tagName === 'P' && el.innerText.length > 20)) {
                if (el.children.length === 0 || (el.tagName === 'P' && el.innerText.trim().length > 0)) {
                    elements.push({
                        tag: el.tagName.toLowerCase(),
                        text: el.innerText.trim().substring(0, 200)
                    });
                }
            }
        }
        return elements;
    });
}

async function run() {
    const input = process.argv[2];
    if (!input) {
        process.stdout.write(JSON.stringify({ success: false, error: "No input provided" }));
        process.exit(1);
    }

    const { action, url, steps } = JSON.parse(input);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let result: { success: boolean, data: any, error?: string } = { success: true, data: null };

    try {
        if (action === 'pilot') {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            if (steps && steps.length > 0) {
                for (const step of steps) {
                    if (step.action === 'click') await page.click(step.selector);
                    else if (step.action === 'type') await page.fill(step.selector, step.text);
                    else if (step.action === 'wait') await page.waitForSelector(step.selector, { timeout: 10000 });
                }
            }
            result.data = {
                url: page.url(),
                title: await page.title(),
                elements: await simplifyDOM(page)
            };
        } else if (action === 'execute') {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            for (const step of steps) {
                if (step.action === 'click') await page.click(step.selector);
                else if (step.action === 'type') await page.fill(step.selector, step.text);
                else if (step.action === 'wait') await page.waitForSelector(step.selector, { timeout: 10000 });
                else if (step.action === 'navigate') await page.goto(step.url, { waitUntil: 'domcontentloaded' });
            }
            result.data = {
                finalUrl: page.url(),
                content: await page.innerText('body')
            };
        }
    } catch (e: any) {
        result.success = false;
        result.error = e.message;
    } finally {
        await browser.close();
    }

    process.stdout.write(JSON.stringify(result));
}

run().catch(err => {
    process.stdout.write(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
});
