// Chat Range Summarizer - SillyTavern Extension

(async function () {

    const DEFAULT_PROMPT =
        `Read the following roleplay/story conversation and write ONE single very detailed narrative summary paragraph. ` +
        `Write in third person past tense. Enclose the entire paragraph in asterisks (*like this*). ` +
        `Describe every key action, event, dialogue highlight, and what each character did, felt, or said. ` +
        `Example: *Rose arrived at Madame Elara's shop where the elder witch taught her the fundamentals of scrying...*\n\n` +
        `Conversation:\n{{chat}}\n\nWrite only the summary paragraph enclosed in asterisks. Nothing else.`;

    const STORAGE_KEY = 'chat_summarizer_prompt';

    function loadPrompt() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_PROMPT;
    }

    function savePrompt(val) {
        localStorage.setItem(STORAGE_KEY, val);
    }

    // ── UI Panel ──────────────────────────────────────────────────────────
    const panelHtml = `
    <div id="cs-panel" style="padding:8px 0; border-top:1px solid var(--SmartThemeBorderColor); margin-top:8px;">
        <b style="display:block; margin-bottom:8px;">📝 Chat Range Summarizer</b>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <label style="font-size:0.9em;">From
                <input type="number" id="cs-start" min="0" value="0"
                    style="width:60px; margin-left:4px; padding:4px; border-radius:4px;
                    border:1px solid var(--SmartThemeBorderColor);
                    background:var(--SmartThemeBlurTintColor);
                    color:var(--SmartThemeBodyColor);">
            </label>
            <label style="font-size:0.9em;">To
                <input type="number" id="cs-end" min="1" value="10"
                    style="width:60px; margin-left:4px; padding:4px; border-radius:4px;
                    border:1px solid var(--SmartThemeBorderColor);
                    background:var(--SmartThemeBlurTintColor);
                    color:var(--SmartThemeBodyColor);">
            </label>
            <button id="cs-run-btn" class="menu_button" style="padding:6px 14px;">Summarize</button>
        </div>

        <div style="margin-top:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.85em; font-weight:bold;">Summary Prompt</span>
                <button id="cs-reset-prompt" class="menu_button" style="padding:2px 8px; font-size:0.78em;">Reset Default</button>
            </div>
            <div style="font-size:0.75em; color:var(--SmartThemeQuoteColor); margin-bottom:4px;">
                Use <code>{{chat}}</code> where you want the conversation inserted.
            </div>
            <textarea id="cs-prompt-editor" rows="7" style="
                width:100%; box-sizing:border-box;
                background:var(--SmartThemeBlurTintColor);
                color:var(--SmartThemeBodyColor);
                border:1px solid var(--SmartThemeBorderColor);
                border-radius:6px; padding:8px;
                font-family:inherit; font-size:0.82em;
                resize:vertical;"></textarea>
            <button id="cs-save-prompt" class="menu_button" style="margin-top:6px; padding:4px 12px; font-size:0.85em;">💾 Save Prompt</button>
            <span id="cs-prompt-saved" style="font-size:0.78em; color:var(--SmartThemeQuoteColor); margin-left:8px; display:none;">Saved!</span>
        </div>

        <div id="cs-status" style="margin-top:8px; font-size:0.82em; color:var(--SmartThemeQuoteColor); min-height:18px;"></div>
    </div>`;

    // Wait for ST to finish loading
    await new Promise(resolve => setTimeout(resolve, 1000));

    const target = document.querySelector('#extensions_settings2') || document.querySelector('#extensions_settings');
    if (target) {
        target.insertAdjacentHTML('beforeend', panelHtml);
    } else {
        console.warn('[ChatSummarizer] Could not find extensions panel.');
    }

    // Load saved prompt into textarea
    document.getElementById('cs-prompt-editor').value = loadPrompt();

    // Save prompt button
    document.getElementById('cs-save-prompt').addEventListener('click', () => {
        const val = document.getElementById('cs-prompt-editor').value.trim();
        if (!val.includes('{{chat}}')) {
            alert('Your prompt must include {{chat}} so the conversation can be inserted!');
            return;
        }
        savePrompt(val);
        const saved = document.getElementById('cs-prompt-saved');
        saved.style.display = 'inline';
        setTimeout(() => saved.style.display = 'none', 2000);
    });

    // Reset to default
    document.getElementById('cs-reset-prompt').addEventListener('click', () => {
        if (confirm('Reset prompt to default?')) {
            document.getElementById('cs-prompt-editor').value = DEFAULT_PROMPT;
            savePrompt(DEFAULT_PROMPT);
        }
    });

    // Summarize button
    document.getElementById('cs-run-btn').addEventListener('click', async () => {
        const start = parseInt(document.getElementById('cs-start').value);
        const end   = parseInt(document.getElementById('cs-end').value);
        if (isNaN(start) || isNaN(end)) { setStatus('⚠️ Enter valid numbers.', true); return; }
        await doSummarize(start, end);
    });

    function setStatus(msg, isError = false) {
        const el = document.getElementById('cs-status');
        if (!el) return;
        el.style.color = isError ? '#e06c75' : 'var(--SmartThemeQuoteColor)';
        el.textContent = msg;
    }

    // ── Register /condense slash command ──────────────────────────────────
    const ctx0 = window.SillyTavern.getContext();
    ctx0.registerSlashCommand('condense', async (args, value) => {
        const parts = value.trim().split(/\s+/);
        if (parts.length < 2) {
            toastr.warning('Usage: /condense start end — e.g. /condense 0 10');
            return;
        }
        const start = parseInt(parts[0]);
        const end   = parseInt(parts[1]);
        if (isNaN(start) || isNaN(end)) {
            toastr.warning('Usage: /condense start end — e.g. /condense 0 10');
            return;
        }
        await doSummarize(start, end);
    }, [], 'Summarize a range of messages into one. Usage: /condense start end', true, true);

    // ── Core Logic ────────────────────────────────────────────────────────
    async function doSummarize(start, end) {
        const ctx  = window.SillyTavern.getContext();
        const chat = ctx.chat;

        if (!chat || chat.length === 0) { setStatus('⚠️ No active chat found.', true); return; }
        if (start < 0 || end >= chat.length) { setStatus(`⚠️ Valid range: 0–${chat.length - 1}`, true); return; }
        if (start >= end) { setStatus('⚠️ "From" must be less than "To".', true); return; }

        const slice = chat.slice(start, end + 1);
        const convoText = slice
            .map(m => `[${m.name}]: ${(m.mes || '').replace(/<[^>]*>/g, '').trim()}`)
            .join('\n\n');

        // Build prompt from saved template
        const template = loadPrompt();
        const prompt   = template.replace('{{chat}}', convoText);

        setStatus('⏳ Generating summary…');
        const btn = document.getElementById('cs-run-btn');
        if (btn) btn.disabled = true;

        const ctx2 = window.SillyTavern.getContext();
        let summary = '';
        try {
            summary = await ctx2.generateRaw({ prompt: prompt, responseLength: 800 });
            summary = summary.trim();
            if (!summary.startsWith('*')) summary = '*' + summary;
            if (!summary.endsWith('*'))   summary = summary + '*';
        } catch (err) {
            setStatus('❌ Generation failed: ' + err.message, true);
            if (btn) btn.disabled = false;
            return;
        }

        if (btn) btn.disabled = false;
        setStatus('✅ Review and edit below.');

        const finalSummary = await showDialog(summary, start, end);
        if (finalSummary === null) { setStatus('Cancelled.'); return; }

        // Apply: replace message at start, delete start+1 through end
        chat[start].mes = finalSummary;
        chat.splice(start + 1, end - start);

        const ctx3 = window.SillyTavern.getContext();
        await ctx3.saveChat();
        await ctx3.printMessages();

        setStatus(`✅ Done! Summary at [${start}], deleted [${start + 1}]–[${end}].`);
    }

    // ── Confirmation Dialog ───────────────────────────────────────────────
    function showDialog(summary, start, end) {
        return new Promise(resolve => {
            document.getElementById('cs-overlay')?.remove();

            const div = document.createElement('div');
            div.id = 'cs-overlay';
            div.style.cssText = `
                position:fixed; top:0; left:0; width:100%; height:100%;
                background:rgba(0,0,0,0.78);
                z-index:10000;
                overflow-y:scroll;
                -webkit-overflow-scrolling:touch;
                box-sizing:border-box;`;

            div.innerHTML = `
            <div style="
                background:var(--SmartThemeChatBackground, #1a1a2e);
                border:1px solid var(--SmartThemeBorderColor, #555);
                border-radius:10px;
                padding:20px;
                margin:80px 16px 80px 16px;
                box-sizing:border-box;">
                <h3 style="margin:0 0 6px; font-size:1.05em;">📋 Summary Preview</h3>
                <p style="font-size:0.82em; color:var(--SmartThemeQuoteColor); margin:0 0 12px;">
                    Range <b>[${start}] → [${end}]</b> &nbsp;·&nbsp;
                    Message [${start}] becomes the summary.
                    Messages [${start+1}]–[${end}] will be <b>deleted</b>.
                    Edit freely before applying.
                </p>
                <textarea id="cs-ta" style="
                    width:100%; height:200px; box-sizing:border-box;
                    background:var(--SmartThemeBlurTintColor, #111);
                    color:var(--SmartThemeBodyColor, #eee);
                    border:1px solid var(--SmartThemeBorderColor, #555);
                    border-radius:6px; padding:10px;
                    font-family:inherit; font-size:0.93em;
                    resize:vertical;">${summary}</textarea>
                <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
                    <button id="cs-cancel" class="menu_button" style="padding:12px; font-size:1em; flex:1;">Cancel</button>
                    <button id="cs-apply" class="menu_button" style="padding:12px; font-size:1em; flex:1;">✓ Apply</button>
                </div>
            </div>`;

            document.body.appendChild(div);

            document.getElementById('cs-apply').addEventListener('click', () => {
                const val = document.getElementById('cs-ta').value.trim();
                div.remove();
                resolve(val || null);
            });
            document.getElementById('cs-cancel').addEventListener('click', () => {
                div.remove();
                resolve(null);
            });
        });
    }

})();
