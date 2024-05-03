import { 
  Okareo 
} from 'okareo-ts-sdk';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;

let project_id: string;

describe('Upload Scenarios', () => {
  beforeAll(async () => {
      const okareo = new Okareo({api_key:OKAREO_API_KEY});
      const pData: any[] = await okareo.getProjects();
      project_id = pData.find(p => p.name === "Global")?.id;
  });

  it('Upload Scenario Set', async () =>  {
      const okareo = new Okareo({api_key:OKAREO_API_KEY});
      const data: any = await okareo.upload_scenario_set(
        {
          file_path: "./test-models/upload_file.jsonl",
          scenario_name: "Upload Scenario Set",
          project_id: project_id
        }
      );
      expect(data.app_link).toBeDefined();

  });

});

