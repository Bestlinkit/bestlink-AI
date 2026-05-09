"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipelineService = exports.AgentModels = void 0;
const ProjectAnalyzer_1 = require("../agents/ProjectAnalyzer");
const UIArchitect_1 = require("../agents/UIArchitect");
const CodeBuilder_1 = require("../agents/CodeBuilder");
var AgentModels;
(function (AgentModels) {
    AgentModels["LOGIC"] = "deepseek/deepseek-r1:free";
    AgentModels["DESIGN"] = "qwen/qwen-2.5-coder-32b-instruct";
    AgentModels["CODE"] = "deepseek/deepseek-chat";
})(AgentModels || (exports.AgentModels = AgentModels = {}));
exports.pipelineService = {
    async runFullPipeline(prompt, onProgress) {
        const analyzer = new ProjectAnalyzer_1.ProjectAnalyzer();
        const architect = new UIArchitect_1.UIArchitect();
        const builder = new CodeBuilder_1.CodeBuilder();
        try {
            // Stage 1: Analyze
            onProgress('ANALYZING', { message: 'DeepSeek R1 is architecting the project manifest...' });
            const manifest = await analyzer.analyze(prompt);
            onProgress('ANALYZED', manifest);
            // Stage 2: Design UI
            onProgress('DESIGNING', { message: 'Qwen is defining the UI structure using the Design System...' });
            let uiPlan = "";
            for await (const chunk of architect.design(manifest, AgentModels.DESIGN)) {
                if (chunk.choices?.[0]?.delta?.content) {
                    uiPlan += chunk.choices[0].delta.content;
                }
            }
            onProgress('DESIGNED', { plan: uiPlan });
            // Stage 3: Build Code
            onProgress('BUILDING', { message: 'CodeBuilder is generating production-ready Next.js code...' });
            for await (const chunk of builder.generatePage(manifest, manifest.pages[0]?.name || 'Home', AgentModels.CODE)) {
                onProgress('STREAMING_CODE', chunk);
            }
            onProgress('COMPLETED');
        }
        catch (error) {
            console.error('Pipeline Error:', error);
            onProgress('ERROR', { message: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
};
