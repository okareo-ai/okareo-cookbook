import { Okareo } from 'okareo-ts-sdk';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL;

describe('Upload Scenarios', () => {
    it('Upload Scenario Set', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const project_id: string = pData.find((project: any) => project.name === "Global")?.id;
        const data: any = await okareo.upload_scenario_set(
          {
            file_path: "ci-models/upload_file.jsonl",
            scenario_name: "Upload Scenario Set",
            project_id: project_id
          }
        );
        console.log(data);
        expect(data.app_link).toBeDefined();

    });

});

