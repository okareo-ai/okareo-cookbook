# Authenticate
import os
from okareo import Okareo


OKAREO_API_KEY = os.environ["OKAREO_API_KEY"]
okareo = Okareo(api_key=OKAREO_API_KEY)
project_id = next(project.id for project in okareo.get_projects() if project.name == "Global")

# You have a working connection to Okareo
print(f"""Connected to Okareo
    with key: {OKAREO_API_KEY[:4]}...{OKAREO_API_KEY[-4:]}
    and project: {project_id}""")