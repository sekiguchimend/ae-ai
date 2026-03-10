/**
 * AE AI Extension - Main CEP Panel Script
 */

(function() {
    'use strict';

    // CSInterface instance
    var csInterface = new CSInterface();

    // DOM Elements
    var elements = {
        connectionStatus: document.getElementById('connection-status'),
        btnCapture: document.getElementById('btn-capture'),
        captureResult: document.getElementById('capture-result'),
        aiPrompt: document.getElementById('ai-prompt'),
        btnGenerate: document.getElementById('btn-generate'),
        generateResult: document.getElementById('generate-result'),
        jsxCode: document.getElementById('jsx-code'),
        btnExecute: document.getElementById('btn-execute'),
        executeResult: document.getElementById('execute-result'),
        syncStatus: document.getElementById('sync-status')
    };

    /**
     * Initialize the panel
     */
    function init() {
        updateConnectionStatus('connected', '接続済み');
        bindEvents();
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        elements.btnCapture.addEventListener('click', captureSelectedLayers);
        elements.btnGenerate.addEventListener('click', generateAnimation);
        elements.btnExecute.addEventListener('click', executeJSX);
    }

    /**
     * Update connection status indicator
     */
    function updateConnectionStatus(status, text) {
        elements.connectionStatus.className = 'status-indicator ' + status;
        elements.connectionStatus.textContent = text;
    }

    /**
     * Show result in result box
     */
    function showResult(element, content, isError) {
        element.textContent = content;
        element.className = 'result-box ' + (isError ? 'error' : 'success');
        element.classList.remove('hidden');
    }

    /**
     * Execute JSX code via evalScript
     */
    function evalScript(script) {
        return new Promise(function(resolve, reject) {
            csInterface.evalScript(script, function(result) {
                if (result === 'EvalScript error.') {
                    reject(new Error('JSX execution error'));
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Capture selected layers (F-1: レイヤー構造の解析)
     */
    function captureSelectedLayers() {
        elements.btnCapture.disabled = true;
        elements.btnCapture.textContent = 'キャプチャ中...';

        evalScript('captureSelectedLayers()')
            .then(function(result) {
                var parsed = JSON.parse(result);
                showResult(elements.captureResult, JSON.stringify(parsed, null, 2), false);
            })
            .catch(function(error) {
                showResult(elements.captureResult, 'Error: ' + error.message, true);
            })
            .finally(function() {
                elements.btnCapture.disabled = false;
                elements.btnCapture.textContent = '選択レイヤーをキャプチャ';
            });
    }

    /**
     * Generate animation via AI (F-3)
     */
    function generateAnimation() {
        var prompt = elements.aiPrompt.value.trim();
        if (!prompt) {
            showResult(elements.generateResult, 'プロンプトを入力してください', true);
            return;
        }

        elements.btnGenerate.disabled = true;
        elements.btnGenerate.textContent = '生成中...';

        // TODO: Supabase Edge Function経由でAI APIを呼び出す
        // 現在はモックレスポンス
        setTimeout(function() {
            var mockCode = '// Generated JSX Code\nvar comp = app.project.activeItem;\nalert("Animation generated!");';
            showResult(elements.generateResult, mockCode, false);
            elements.jsxCode.value = mockCode;
            elements.btnGenerate.disabled = false;
            elements.btnGenerate.textContent = 'AIで生成';
        }, 1000);
    }

    /**
     * Execute JSX code
     */
    function executeJSX() {
        var code = elements.jsxCode.value.trim();
        if (!code) {
            showResult(elements.executeResult, 'コードを入力してください', true);
            return;
        }

        elements.btnExecute.disabled = true;
        elements.btnExecute.textContent = '実行中...';

        // Security validation (コードインジェクション対策)
        var dangerousCommands = ['system.callSystem', 'File.remove', 'File.execute'];
        var hasDanger = dangerousCommands.some(function(cmd) {
            return code.indexOf(cmd) !== -1;
        });

        if (hasDanger) {
            showResult(elements.executeResult, 'Error: 危険なコマンドが検出されました', true);
            elements.btnExecute.disabled = false;
            elements.btnExecute.textContent = '実行';
            return;
        }

        evalScript(code)
            .then(function(result) {
                showResult(elements.executeResult, 'Result: ' + (result || 'undefined'), false);
            })
            .catch(function(error) {
                showResult(elements.executeResult, 'Error: ' + error.message, true);
            })
            .finally(function() {
                elements.btnExecute.disabled = false;
                elements.btnExecute.textContent = '実行';
            });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
