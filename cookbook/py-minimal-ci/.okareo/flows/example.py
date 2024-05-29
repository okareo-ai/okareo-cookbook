#!/usr/bin/env python3
import os
from okareo import Okareo
OKAREO_API_KEY = os.environ["OKAREO_API_KEY"]
okareo = Okareo(OKAREO_API_KEY)
print("Python example to get projects")
projects = okareo.get_projects()
print('Project List: ', projects)
