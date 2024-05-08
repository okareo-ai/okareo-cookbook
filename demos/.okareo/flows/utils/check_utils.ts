import { Okareo, UploadEvaluatorProps } from 'okareo-ts-sdk';

export type CHECK_TYPE = {
    name: string;
    description: string;
    output_data_type: string;
    requires_scenario_input?: boolean;
    requires_scenario_result?: boolean;
    update?: boolean;
}
  
        
        
export const addCheck = async (okareo: Okareo, project_id: string, check: CHECK_TYPE) => {
    const check_primitive = await okareo.generate_check({  
    project_id,
    ...check
    });
    if (check_primitive.generated_code && check_primitive.generated_code.length > 0) {
    return await okareo.upload_check({
        project_id,
        ...check_primitive,
        update: true,
    } as UploadEvaluatorProps);
    }
    throw new Error(`${check.name}: Failed to generate a check.`);
}

export const register_checks = async (okareo: Okareo, project_id: string, required_checks: CHECK_TYPE[]) => {
    const checks = await okareo.get_all_checks();
    for (const demo_check of required_checks) {
    const isReg: boolean = (checks.filter((c) => c.name === demo_check.name).length > 0);
    if (!isReg || demo_check.update === true) {
        const new_check = await addCheck(okareo, project_id, demo_check);
        console.log(`Check ${demo_check.name} has been created and is now available.`);
    } else {
        console.log(`Check ${demo_check.name} is available. No need to add it again`);
    }
    } 
}
