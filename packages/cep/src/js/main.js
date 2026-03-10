/**
 * AE AI Extension - Main CEP Panel Script
 * Modern Chat-like UI
 */

(function() {
    'use strict';

    // CSInterface instance
    var csInterface = new CSInterface();

    // Configuration (CONFIG is loaded from config.js)
    var config = {
        supabaseUrl: (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL) || '',
        supabaseAnonKey: (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY) || '',
        aiProvider: localStorage.getItem('ae_ai_provider') || (typeof CONFIG !== 'undefined' && CONFIG.DEFAULT_AI_PROVIDER) || 'claude',
        theme: localStorage.getItem('ae_ai_theme') || 'light'
    };

    // Current state
    var state = {
        layerData: null,
        generatedCode: '',
        isGenerating: false
    };

    // DOM Elements
    var elements = {};

    /**
     * Initialize the panel
     */
    function init() {
        cacheElements();
        applyTheme(config.theme);
        bindEvents();
        loadSettings();
        checkSupabaseConnection();
        setupTextareaAutoResize();
    }

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements = {
            // Theme
            btnTheme: document.getElementById('btn-theme'),

            // Settings
            btnSettings: document.getElementById('btn-settings'),
            settingsPanel: document.getElementById('settings-panel'),
            aiProvider: document.getElementById('ai-provider'),
            btnSaveSettings: document.getElementById('btn-save-settings'),
            btnCancelSettings: document.getElementById('btn-cancel-settings'),

            // Input
            aiPrompt: document.getElementById('ai-prompt'),
            btnCapture: document.getElementById('btn-capture'),
            btnAnalyze: document.getElementById('btn-analyze'),
            btnGenerate: document.getElementById('btn-generate'),
            connectionStatus: document.getElementById('connection-status'),

            // Capture info
            captureInfo: document.getElementById('capture-info'),
            captureCount: document.getElementById('capture-count'),
            btnClearCapture: document.getElementById('btn-clear-capture'),

            // Result
            resultArea: document.getElementById('result-area'),
            resultCode: document.getElementById('result-code'),
            btnCopy: document.getElementById('btn-copy'),
            btnExecute: document.getElementById('btn-execute'),
            executeResult: document.getElementById('execute-result')
        };
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Theme toggle
        elements.btnTheme.addEventListener('click', toggleTheme);

        // Settings
        elements.btnSettings.addEventListener('click', toggleSettings);
        elements.btnSaveSettings.addEventListener('click', saveSettings);
        elements.btnCancelSettings.addEventListener('click', toggleSettings);

        // Input actions
        elements.btnCapture.addEventListener('click', captureSelectedLayers);
        elements.btnAnalyze.addEventListener('click', analyzeLayers);
        elements.btnGenerate.addEventListener('click', generateAnimation);
        elements.btnClearCapture.addEventListener('click', clearCapture);

        // Result actions
        elements.btnCopy.addEventListener('click', copyCode);
        elements.btnExecute.addEventListener('click', executeJSX);

        // Enter key to submit
        elements.aiPrompt.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateAnimation();
            }
        });
    }

    /**
     * Setup textarea auto-resize and button state
     */
    function setupTextareaAutoResize() {
        var textarea = elements.aiPrompt;

        // Auto-resize
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 150) + 'px';
            updateSendButtonState();
        });

        // Initial state
        updateSendButtonState();
    }

    /**
     * Update send button state based on input
     */
    function updateSendButtonState() {
        var hasText = elements.aiPrompt.value.trim().length > 0;
        elements.btnGenerate.disabled = !hasText;
    }

    /**
     * Apply theme
     */
    function applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(theme + '-theme');
        config.theme = theme;
        localStorage.setItem('ae_ai_theme', theme);
    }

    /**
     * Toggle theme
     */
    function toggleTheme() {
        var newTheme = config.theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    }

    /**
     * Toggle settings panel
     */
    function toggleSettings() {
        elements.settingsPanel.classList.toggle('hidden');
    }

    /**
     * Load settings into form
     */
    function loadSettings() {
        elements.aiProvider.value = config.aiProvider;
    }

    /**
     * Save settings
     */
    function saveSettings() {
        config.aiProvider = elements.aiProvider.value;
        localStorage.setItem('ae_ai_provider', config.aiProvider);
        toggleSettings();
    }

    /**
     * Check Supabase connection
     */
    function checkSupabaseConnection() {
        var dot = elements.connectionStatus;

        // Check if config is properly set
        if (!config.supabaseUrl || config.supabaseUrl === 'YOUR_SUPABASE_URL' ||
            !config.supabaseAnonKey || config.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            dot.className = 'connection-dot disconnected';
            dot.title = 'config.js未設定';
            return;
        }

        dot.className = 'connection-dot connecting';
        dot.title = '接続確認中...';

        fetch(config.supabaseUrl + '/functions/v1/generate-jsx', {
            method: 'OPTIONS',
            headers: {
                'Authorization': 'Bearer ' + config.supabaseAnonKey
            }
        })
        .then(function(response) {
            if (response.ok) {
                dot.className = 'connection-dot connected';
                dot.title = '接続済み';
            } else {
                dot.className = 'connection-dot disconnected';
                dot.title = '接続エラー';
            }
        })
        .catch(function() {
            dot.className = 'connection-dot disconnected';
            dot.title = '接続エラー';
        });
    }

    /**
     * Execute JSX via evalScript
     */
    function evalScript(script) {
        return new Promise(function(resolve, reject) {
            csInterface.evalScript(script, function(result) {
                if (result === 'EvalScript error.') {
                    reject(new Error('JSX実行エラー'));
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Capture selected layers
     */
    function captureSelectedLayers() {
        elements.btnCapture.disabled = true;

        evalScript('captureSelectedLayers()')
            .then(function(result) {
                var parsed = JSON.parse(result);
                state.layerData = parsed;

                // Update capture info
                var count = parsed.layers ? parsed.layers.length : 0;
                elements.captureCount.textContent = count;
                elements.captureInfo.classList.remove('hidden');
            })
            .catch(function(error) {
                alert('キャプチャエラー: ' + error.message);
            })
            .finally(function() {
                elements.btnCapture.disabled = false;
            });
    }

    /**
     * Clear captured layers
     */
    function clearCapture() {
        state.layerData = null;
        elements.captureInfo.classList.add('hidden');
    }

    /**
     * Analyze layers (calls Supabase Edge Function)
     */
    function analyzeLayers() {
        if (!state.layerData) {
            alert('先にレイヤーをキャプチャしてください');
            return;
        }

        if (!config.supabaseUrl || config.supabaseUrl === 'YOUR_SUPABASE_URL' ||
            !config.supabaseAnonKey || config.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            alert('config.jsにSupabase設定が必要です');
            return;
        }

        elements.btnAnalyze.disabled = true;

        fetch(config.supabaseUrl + '/functions/v1/analyze-layers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + config.supabaseAnonKey
            },
            body: JSON.stringify({
                provider: config.aiProvider,
                layerData: JSON.stringify(state.layerData, null, 2)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                var analysis = JSON.stringify(data.analysis || data, null, 2);
                elements.resultCode.textContent = analysis;
                elements.resultArea.classList.remove('hidden');
            } else {
                alert('分析エラー: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(function(error) {
            alert('分析エラー: ' + error.message);
        })
        .finally(function() {
            elements.btnAnalyze.disabled = false;
        });
    }

    /**
     * Generate animation via AI
     */
    function generateAnimation() {
        var prompt = elements.aiPrompt.value.trim();

        if (!prompt) {
            return;
        }

        if (!config.supabaseUrl || config.supabaseUrl === 'YOUR_SUPABASE_URL' ||
            !config.supabaseAnonKey || config.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            alert('config.jsにSupabase設定が必要です');
            return;
        }

        if (state.isGenerating) {
            return;
        }

        state.isGenerating = true;
        elements.btnGenerate.disabled = true;
        elements.btnGenerate.parentElement.classList.add('loading');

        // Build context from captured layers
        var characterContext = '';
        if (state.layerData) {
            characterContext = '## キャラクター構造\n' + JSON.stringify(state.layerData, null, 2);
        }

        fetch(config.supabaseUrl + '/functions/v1/generate-jsx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + config.supabaseAnonKey
            },
            body: JSON.stringify({
                provider: config.aiProvider,
                characterContext: characterContext,
                userPrompt: prompt,
                maxTokens: 2000
            })
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('API error: ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            if (data.success && data.code) {
                state.generatedCode = data.code;
                elements.resultCode.textContent = data.code;
                elements.resultArea.classList.remove('hidden');
                elements.executeResult.classList.add('hidden');
            } else {
                var errorMsg = data.error || 'コード生成に失敗しました';
                if (data.issues) {
                    errorMsg += '\n' + data.issues.join('\n');
                }
                alert(errorMsg);
            }
        })
        .catch(function(error) {
            alert('エラー: ' + error.message);
        })
        .finally(function() {
            state.isGenerating = false;
            elements.btnGenerate.disabled = false;
            elements.btnGenerate.parentElement.classList.remove('loading');
        });
    }

    /**
     * Copy code to clipboard
     */
    function copyCode() {
        var code = elements.resultCode.textContent;
        if (code) {
            // CEP doesn't have clipboard API, use execCommand
            var textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            // Visual feedback
            var originalTitle = elements.btnCopy.title;
            elements.btnCopy.title = 'コピーしました!';
            setTimeout(function() {
                elements.btnCopy.title = originalTitle;
            }, 2000);
        }
    }

    /**
     * Execute JSX code
     */
    function executeJSX() {
        var code = state.generatedCode || elements.resultCode.textContent;

        if (!code) {
            return;
        }

        // Security check
        var dangerousCommands = ['system.callSystem', 'File.remove', 'File.execute', 'Folder.remove', '$.evalFile'];
        var hasDanger = dangerousCommands.some(function(cmd) {
            return code.indexOf(cmd) !== -1;
        });

        if (hasDanger) {
            showExecuteResult('危険なコマンドが検出されました', true);
            return;
        }

        elements.btnExecute.disabled = true;

        evalScript(code)
            .then(function(result) {
                showExecuteResult('実行完了: ' + (result || 'OK'), false);
            })
            .catch(function(error) {
                showExecuteResult('エラー: ' + error.message, true);
            })
            .finally(function() {
                elements.btnExecute.disabled = false;
            });
    }

    /**
     * Show execute result
     */
    function showExecuteResult(message, isError) {
        elements.executeResult.textContent = message;
        elements.executeResult.className = 'execute-result ' + (isError ? 'error' : 'success');
        elements.executeResult.classList.remove('hidden');
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
