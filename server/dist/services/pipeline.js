"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipelineService = exports.AgentModels = void 0;
const CodeBuilder_1 = require("../agents/CodeBuilder");
var AgentModels;
(function (AgentModels) {
    AgentModels["BUILDER"] = "openrouter/free";
    AgentModels["FALLBACK"] = "deepseek/deepseek-chat-v3-0324:free";
})(AgentModels || (exports.AgentModels = AgentModels = {}));
const activeExecutions = new Set();
const withTimeout = (promise, ms, stageName) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout exceeded for stage: ${stageName} (${ms}ms)`));
        }, ms);
        promise.then((res) => { clearTimeout(timer); resolve(res); }, (err) => { clearTimeout(timer); reject(err); });
    });
};
exports.pipelineService = {
    async runFullPipeline(prompt, onProgress, sessionId = 'global', attachments = []) {
        if (activeExecutions.has(sessionId)) {
            onProgress('EXECUTION_ERROR', { message: 'System is currently processing a build. Please wait.' });
            return;
        }
        activeExecutions.add(sessionId);
        const builder = new CodeBuilder_1.CodeBuilder();
        let finalStatus = 'failed';
        try {
            onProgress('BUILD_START', { message: 'Initializing direct production pipeline...' });
            // Emergency Core: Direct model call
            const codebasePayload = await withTimeout(builder.build(prompt, AgentModels.BUILDER, onProgress, attachments), 120000, 'Building');
            if (codebasePayload.error) {
                throw new Error(codebasePayload.error);
            }
            finalStatus = 'success';
            onProgress('COMPLETED_PROJECT', {
                status: finalStatus,
                message: 'Project generation successful.',
                payload: codebasePayload
            });
        }
        catch (error) {
            console.error('Pipeline Execution Failed:', error);
            onProgress('EXECUTION_ERROR', {
                message: error instanceof Error ? error.message : 'Unknown pipeline error'
            });
            finalStatus = 'error';
        }
        finally {
            activeExecutions.delete(sessionId);
            onProgress('COMPLETE', { status: finalStatus });
        }
    }
};
