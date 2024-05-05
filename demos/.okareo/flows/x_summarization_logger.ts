import { 
    Okareo, 
    TestRunType, generation_reporter,
} from "okareo-ts-sdk";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const PROJECT_NAME = "Global";
const MODEL_NAME = "Meeting Summarizer";

type Assertions = {
    metrics_min?: {[key: string]: number};
    metrics_max?: {[key: string]: number};
    pass_rate?: {[key: string]: number};
}

const report_definition = {
    metrics_min: {
        "consistency": 4.5,
        "relevance": 4.5,
        //"demo.Summary.WordCount": 25,
    }, 
    metrics_max: {
        "demo.Summary.Length": 256,
    }, 
    pass_rate: {
        "demo.Summary.Under256": 0.75,
        "demo.Summary.JSON": 1,
    }
}

const print_generation_report = (results: {report: any, run: any}[], assertions: Assertions) => {
    const assertion_keys: string[] = [];
    for (const assertType in assertions) {
        const keys = Object.keys(assertions[assertType]);
        assertion_keys.push(...keys);
    }

    const assertion_table: any[] = [
        { assertion: "min", ...assertions.metrics_min},
        { assertion: "max", ...assertions.metrics_max},
        { assertion: "pass_rate", ...assertions.pass_rate}
    ];

    console.log("Assertions:");
    console.table(assertion_table);

    console.log("\nResults:");
    console.table(
        results.map(r => {
            const run = r.run;
            const report = r.report;
            if (run.model_metrics && run.model_metrics.mean_scores) {
                const metrics = {};
                for (const check in run.model_metrics.mean_scores) {
                    if (assertion_keys.includes(check)) {
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

interface ReportProps {
    project_id: string,
    models?: string[],
    tags?: string[],
    last_n?: number,
    assertions: Assertions;
}

const log_report_runs = async (props: ReportProps) => {
    const {project_id, models = [], tags = [], last_n = 10, assertions} = props;
    const okareo = new Okareo({api_key:OKAREO_API_KEY});
    
    const all_runs: any[] = await okareo.find_test_runs({
        //tags: tags,
        project_id: project_id
    });
    let runs = all_runs.filter(r => r.type === TestRunType.NL_GENERATION);
    runs = runs.sort((a, b) => a.start_time > b.start_time ? -1 : 1);

    if (runs.length > 0) {
        if (models.length > 0) {
            const all_models = await okareo.get_all_models(project_id);
            const model_ids: string[] = (all_models.map(m => {
                if (models.includes(m.name) || models.includes(m.id)) {
                    return m.id;
                }
            })).filter(m => m !== undefined);

            if (model_ids) {
                runs = runs.filter(r => model_ids.includes(r.mut_id));
            } else {
                console.log("Model not found - no history available.");
            }
        }
    }

    // after being filtered by models, if still more than 0 runs
    if (runs.length > 0) {
        runs.reverse();
        runs.splice(0,Math.max(0,runs.length-last_n));
        const reports: any[] = [];
        for (const run of runs) {
            if (run.model_metrics && run.model_metrics.mean_scores) {
                const report = generation_reporter({
                    eval_run: run,
                    ...assertions
                });
                
                reports.push({run, report});
            }
        }
        print_generation_report(reports, assertions);
    } else {
        console.log("No runs found matching specification.");
    }

}


const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

        log_report_runs({
            project_id,
            tags: ["Demo"],
            models: [MODEL_NAME],
            assertions: report_definition
        });
        
	} catch (error) {
		console.error(error);
	}
}
main();
