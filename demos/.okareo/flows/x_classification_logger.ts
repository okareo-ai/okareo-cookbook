import { 
    Okareo, 
    TestRunType, 
    classification_reporter, 
} from "okareo-ts-sdk";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const PROJECT_NAME = "Global";
const MODEL_NAME = "Meeting Summarizer";

type Assertions = {
    error_max:  number;
    metrics_min: {[key: string]: number};
}

const report_definition = {
    error_max: 8, 
    metrics_min: {
        precision: 0.7,
        recall: 0.8,
        f1: 0.7,
        accuracy: 0.8
    }
}

const print_classification_report = (results: {report: any, run: any}[], assertions: Assertions) => {
    const assertion_keys: string[] = [];
    for (const assertType in assertions) {
        const keys = Object.keys(assertions[assertType]);
        assertion_keys.push(...keys);
    }

    const assertion_table: any[] = [
        { assertion: "error_max", value: assertions.error_max },
        { assertion: "min", ...assertions.metrics_min}
    ];

    console.log("Assertions:");
    console.table(assertion_table);

    console.log("\nResults:");
    console.table(
        results.map(r => {
            const run = r.run;
            const report = r.report;
            if (run.model_metrics && run.error_matrix) {
                const metrics = {};
                for (const check in run.model_metrics.weighted_average) {
                    if (assertion_keys.includes(check)) {
                        const m = run.model_metrics.weighted_average[check];
                        let passed = true;
                        let minKeys = Object.keys(report.fail_metrics.min);
                        //let maxKeys = Object.keys(report.fail_metrics.max);
                        //let passKeys = Object.keys(report.fail_metrics.pass_rate);
                        //if (minKeys.includes(check) || maxKeys.includes(check) || passKeys.includes(check)) {
                        if (minKeys.includes(check)) {
                            passed = false;
                        }
                        metrics[check] = (passed ? "✅ " : "❌ ") + m.toFixed(2);
                    }
                }
                return {
                    date: new Date(run.start_time).toDateString(),
                    passed: report.pass ? "🟢" : "🔴",
                    errors: ((report.errors < assertions.error_max) ? "✅ " : "❌ ") + report.errors,
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
    
    let runs = all_runs.filter(r => r.type === TestRunType.MULTI_CLASS_CLASSIFICATION);

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
            if (run.model_metrics && run.error_matrix) {
                const report = classification_reporter({
                    eval_run: run,
                    ...assertions
                });
                reports.push({run, report});
            }
        }
        print_classification_report(reports, assertions);
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
            tags: ["TS SDK"],
            //models: [MODEL_NAME],
            assertions: report_definition
        });
        
	} catch (error) {
        // intentionally not blocking the build.
        console.log("Error", error);
		//throw new Error(error);
	}
}
main();
