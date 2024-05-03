import { Okareo } from 'okareo-ts-sdk';

const okareo = new Okareo({api_key:process.env.OKAREO_API_KEY });

const main = async () => {
    try {
        const projects = await okareo.getProjects();
        console.log(projects);
    } catch (error) {
        console.error(error);
    }
}

main();