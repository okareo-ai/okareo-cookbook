import { 
    Okareo, 
    UploadEvaluatorProps,
    RunTestProps,
    classification_reporter,
    ModelUnderTest, OpenAIModel, SeedData, ScenarioType, TestRunType, CustomModel,
    generation_reporter,
} from '/Users/guiair/dev/okareo/okareo-typescript-sdk/dist/'; //from "okareo-ts-sdk";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);

const report_definition = {
    metrics_min: {
        "consistency_summary": 4.9,
        "relevance_summary": 4.9
    }, 
    metrics_max: {
        "demo.summaryLength": 256,
    }, 
    pass_rate: {
        "demo.summaryUnder256": 1,
        "demo.isSummaryJSON": 1,
    }
}

const print_table_report = (results: {report: any, run: any}[]) => {
    console.table(
        results.map(r => {
            const run = r.run;
            const report = r.report;
            if (run.model_metrics && run.model_metrics.mean_scores) {
                const metrics = {};
                for (const check in run.model_metrics.mean_scores) {
                    const m = run.model_metrics.mean_scores[check];
                    let passed = true;
                    let minKeys = Object.keys(report.fail_metrics.min);
                    let maxKeys = Object.keys(report.fail_metrics.max);
                    let passKeys = Object.keys(report.fail_metrics.pass_rate);
                    if (minKeys.includes(check) || maxKeys.includes(check) || passKeys.includes(check)) {
                        passed = false;
                    }
                    metrics[check] = (passed ? "✅ " : "❌ ") + m.toFixed(2);
                }
                return {
                    date: new Date(run.start_time).toDateString(),
                    passed: report.pass ? "🟢" : "🔴",
                    ...metrics,
                }
            }
        })
    );
}

const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;

        const all_models = await okareo.get_all_models(project_id);
        const model = all_models.find(m => m.name === "Meeting Summarizer");
        
        const runs = await okareo.find_test_runs({
            project_id,
            mut_id: model.id,
        });
        runs.sort((a, b) => a.start_time > b.start_time ? -1 : 1);
        const last_6 = runs.splice(0,6);
        last_6.reverse();
        const reports: any[] = [];
        for (const run of last_6) {
            if (run.model_metrics && run.model_metrics.mean_scores) {
                const report = generation_reporter({
                    eval_run: run,
                    ...report_definition
                });
                reports.push({run, report});
            }
        }
        print_table_report(reports);
        
	} catch (error) {
		console.error(error);
	}
}
main();




