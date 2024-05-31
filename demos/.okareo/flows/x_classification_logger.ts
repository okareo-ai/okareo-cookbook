import { 
    Okareo, 
    TestRunType, 
    EvaluationHistoryReporter
} from "okareo-ts-sdk";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const PROJECT_NAME = "Global";

const report_definition = {
    error_max: 2, 
    metrics_min: {
        precision: 0.7,
        recall: 0.8,
        f1: 0.7,
        accuracy: 0.8
    },
    metrics_max: {
        precision: 0.9,
        recall: 0.9,
        f1: 0.75,
        accuracy: 0.88
    }
}

const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

        const all_runs: any[] = await okareo.find_test_runs({
            //tags: tags,
            project_id: project_id
        });
        const history = new EvaluationHistoryReporter({
            evals: all_runs,
            assertions: report_definition,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        });
        history.log();
        
	} catch (error) {
        // intentionally not blocking the build.
        console.log("Error", error);
		//throw new Error(error);
	}
}
main();
