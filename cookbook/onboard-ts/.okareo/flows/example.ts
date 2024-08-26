import { Okareo } from 'okareo-ts-sdk';
const okareo = new Okareo({api_key:process.env.OKAREO_API_KEY });
const main = async () => {
	try {
		console.log("Typescript example to get projects");
		const projects = await okareo.getProjects();
		console.log("List Projects:", projects);
	} catch (error) {
		console.error(error);
	}
}
main();