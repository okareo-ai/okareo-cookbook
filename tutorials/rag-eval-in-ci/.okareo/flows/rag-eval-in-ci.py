#!/usr/bin/env python3


### Load documents and create corresponding metadata ###
# Import the necessary libraries
import os
from io import StringIO  
import pandas as pd

# Load documents from Okareo's GitHub repository
webbizz_articles = os.popen('curl https://raw.githubusercontent.com/okareo-ai/okareo-python-sdk/main/examples/webbizz_10_articles.jsonl').read()

# Convert the JSONL string to a pandas DataFrame
jsonObj = pd.read_json(path_or_buf=StringIO(webbizz_articles), lines=True)

# Create rough categories for each document based on the content
# Store the categories in metadata_list
metadata_list = []
input_list = list(jsonObj.input)
for i in range(len(input_list)):
    if "sustainability" in input_list[i] or "security" in list(input_list[i]):
        metadata_list.append({"article_type": "Safety and sustainability"})
    elif "support" in input_list[i] or "help" in list(input_list[i]):
        metadata_list.append({"article_type": "Support"})
    elif "return" in input_list[i]:
        metadata_list.append({"article_type": "Return and exchange"})
    else:
        metadata_list.append({"article_type": "Miscellaneous"})


### Create ChromaDB instance and add documents and metadata to it ###
# Import ChromaDB
import chromadb

# Create a ChromaDB client
chroma_client = chromadb.Client()

# Create a ChromaDB collection
# The collection will be used to store the documents as vector embeddings
# We want to measure the similarity between questions and documents using cosine similarity
collection = chroma_client.create_collection(name="retrieval_test", metadata={"hnsw:space": "cosine"})

# Add the documents to the collection with the corresponding metadata (the in-built embedding model converts the documents to vector embeddings)
collection.add(
    documents=list(jsonObj.input),
    ids=list(jsonObj.result),
    metadatas=metadata_list
)




### Create a scenario set ###
# Import libraries
import tempfile
from okareo import Okareo
from okareo_api_client.models import TestRunType
from okareo.model_under_test import CustomModel, ModelInvocation

# Create an instance of the Okareo client

OKAREO_API_KEY = os.environ.get("OKAREO_API_KEY")
if not OKAREO_API_KEY:
    raise ValueError("OKAREO_API_KEY environment variable is not set")
okareo = Okareo(OKAREO_API_KEY)

# Download questions from Okareo's GitHub repository
webbizz_retrieval_questions = os.popen('curl https://raw.githubusercontent.com/okareo-ai/okareo-python-sdk/main/examples/webbizz_retrieval_questions.jsonl').read()

# Save the questions to a temporary file
temp_dir = tempfile.gettempdir()
file_path = os.path.join(temp_dir, "webbizz_retrieval_questions.jsonl")
with open(file_path, "w+") as file:
    file.write(webbizz_retrieval_questions)

# Upload the questions to Okareo from the temporary file
scenario = okareo.upload_scenario_set(file_path=file_path, scenario_name="Retrieval Articles Scenario")

# Clean up the temporary file
os.remove(file_path)





### Create custom embedding model and register it ###
# A function to convert the query results from our ChromaDB collection into a list of dictionaries with the document ID, score, metadata, and label
def query_results_to_score(results):
    parsed_ids_with_scores = []
    for i in range(0, len(results['distances'][0])):
        # Create a score based on cosine similarity
        score = (2 - results['distances'][0][i]) / 2
        parsed_ids_with_scores.append(
            {
                "id": results['ids'][0][i],
                "score": score,
                "metadata": results['metadatas'][0][i],
                "label": f"{results['metadatas'][0][i]['article_type']} WebBizz Article w/ ID: {results['ids'][0][i]}"
            }
        )
    return parsed_ids_with_scores


# Define a custom retrieval model that uses the ChromaDB collection to retrieve documents
# The model will return the top 5 most relevant documents based on the input query
class CustomEmbeddingModel(CustomModel):
    def invoke(self, input: str) -> ModelInvocation:
        # Query the collection with the input text
        results = collection.query(
            query_texts=[input],
            n_results=5
        )
        # Return formatted query results and the model response context
        return ModelInvocation(model_prediction=query_results_to_score(results), model_output_metadata={'model_data': input})

# Register the model with Okareo
# This will return a model if it already exists or create a new one if it doesn't
model_under_test = okareo.register_model(name="vectordb_retrieval_test", model=CustomEmbeddingModel(name="custom retrieval"), update=True)




### Evaluating the custom embedding model ###

# Define thresholds for the evaluation metrics
at_k_intervals = [1, 2, 3, 4, 5] 

# Choose your retrieval evaluation metrics
metrics_kwargs = {
	"accuracy_at_k": at_k_intervals ,
	"precision_recall_at_k": at_k_intervals ,
	"ndcg_at_k": at_k_intervals,
	"mrr_at_k": at_k_intervals,
	"map_at_k": at_k_intervals,
}

# Import the datetime module for timestamping
from datetime import datetime

# Perform a test run using the uploaded scenario set
test_run_item = model_under_test.run_test(
    scenario=scenario, # use the scenario from the scenario set uploaded earlier
    name=f"Retrieval Test Run - {datetime.now().strftime('%m-%d %H:%M:%S')}", # add a timestamp to the test run name
    test_run_type=TestRunType.INFORMATION_RETRIEVAL, # specify that we are running an information retrieval test
    calculate_metrics=True,
    # Define the evaluation metrics to calculate
    metrics_kwargs=metrics_kwargs
)

# Generate a link back to Okareo for evaluation visualization
model_results = test_run_item.model_metrics.to_dict()
app_link = test_run_item.app_link
print(f"See results in Okareo: {app_link}")

