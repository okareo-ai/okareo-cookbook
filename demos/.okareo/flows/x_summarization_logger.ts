import { 
    Okareo, 
    TestRunType,
    EvaluationHistoryReporter
} from "okareo-ts-sdk";
import * as core from '@actions/core';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const PROJECT_NAME = "Global";

const report_definition = {
	metrics_min: {
		"consistency": 4.0,
		"relevance": 4.0,
		"demo.Attendees.Length": 2,
		"demo.Actions.Length": 2,
	},
	metrics_max: {
		"demo.Summary.Length": 256,
	},
	pass_rate: {
		"demo.Summary.Under256": 0.75,
		"demo.Summary.JSON": 1,
	},
};

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
            type: TestRunType.NL_GENERATION,
        });
        history.log();
        
	} catch (error) {
        // intentionally not blocking the build.
		core.setFailed("Failed: "+error);
	}
}
main();
