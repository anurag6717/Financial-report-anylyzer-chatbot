from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import fitz
from io import BytesIO
import re
from langchain.chains import ConversationalRetrievalChain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
# from langchain.llms import HuggingFacePipeline
from fastapi.responses import JSONResponse
# import base64
# import io
import requests
import os
import pickle
from loadllm import Loadllm
# from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from tempfile import gettempdir
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder

reranker_model = CrossEncoder(model_name="bge-reranker-base", max_length=512)

app = FastAPI()

origins = ["*"]  # Set this to your frontend URL(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.environ["GRADIENT_ACCESS_TOKEN"] = "qmo0P8rEERRVzm0XoEIvm9j41aQEu5Z2"
os.environ["GRADIENT_WORKSPACE_ID"] = "fde7dc26-fb49-4ba9-9fc3-818e15c189ae_workspace"

chat_history = []
llm = Loadllm.load_llm()

def open_pdf_from_url(pdf_url):
    try:
        # Download PDF content from the URL
        response = requests.get(pdf_url)
        response.raise_for_status()

        # Open the PDF using PyMuPDF
        pdf_document = fitz.open(stream=BytesIO(response.content))
        return pdf_document
    except Exception as e:
        print(f"Error: {e}")

def download_file(url, dest_folder=None):
    if dest_folder is None:
        dest_folder = gettempdir()

    response = requests.get(url)
    
    if response.status_code == 200:
        # Extracting safe file name from the URL
        file_name = os.path.join(dest_folder, "temp.pdf")
        
        # Saving the file to the temporary folder
        with open(file_name, 'wb') as file:
            file.write(response.content)
            return file_name        
    else:
        print(f"Failed to download file. Status code: {response.status_code}")


def pdfTextExtractor(pdf_document):
    text = ""
    for page_num in range(pdf_document.page_count):
        page = pdf_document.load_page(page_num)
        text += page.get_text("text")
    text = re.sub(r"\n", " ", text)
    pdf_document.close()
    return text
text_splitter = RecursiveCharacterTextSplitter(
    # Set a really small chunk size, just to show.
    chunk_size=800,
    chunk_overlap=200,
    length_function=len,
)


def intro(VectorStore):
    keyword = ["About","Financial Performance", "Letter of Ceo","Management Discussion"]
    output=[]
    for keyword in keyword:
        doc = VectorStore.similarity_search(keyword, k=1)
        output.append(doc[0].page_content)
    return f"""{output[0]}\n
{output[1]}\n
{output[2]}\n
{output[3]}\n
"""


def rerank_docs(query, retrieved_docs):
    query_and_docs = [(query, r.page_content) for r in retrieved_docs]
    scores = reranker_model.predict(query_and_docs)
    return sorted(list(zip(retrieved_docs, scores)), key=lambda x: x[1], reverse=True)

template = """You are a financial expert with access to the annual report of the company.
When answering questions about the company's financial performance, prioritize information from the Financial Statements section.Considering the user's question, provide clear and concise answers from given context.
{context}

Question: {question}
Answer:
"""

graphtemplate = """Question: {question}

Answer: """

prompt = PromptTemplate.from_template(template)

graphPrompt = PromptTemplate.from_template(template)

IntroTemplate = """Based on this data:
{info}
on the basis of the following report give Overview of the annual report in short
overview:
"""

IntroPrompt = PromptTemplate.from_template(IntroTemplate)

embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

@app.get("/")
def read_root():
    return {"message": "Hello, this is your FastAPI server on Colab with pyngrok!"}


@app.post("/api/vectorizer")
async def upload_file(data: dict):
    store_name = data["id"]
    url = data["url"]
    download_file(url, "temp")
    
    doc = fitz.open("temp/temp.pdf")
    pages=[]
    for page_no in range(doc.page_count):
        text = doc[page_no].get_text()
        text = re.sub(r"\n", " ", text)
        text = text_splitter.split_text(text=text)
        for chunk in text:
            page = Document(page_content=chunk, metadata = {"page":page_no+1})
            pages.append(page)    
    doc.close()
    os.remove("temp/temp.pdf")
    
    if os.path.exists(f"vectorestore/{store_name}.pkl"):
        return {"detail":"vectors already exists"}
    else:
        VectorStore = FAISS.from_documents(pages, embedding=embeddings)
        with open(f"vectorestore/{store_name}.pkl", "wb") as f:
            pickle.dump(VectorStore, f)
        return {"message":"sucessfuly vectorize"}
        

 
@app.post("/api/generate")
async def generate_response(data: dict):
    store_name = data["id"]
    with open(f"vectorestore/{store_name}.pkl", "rb") as f:
        VectorStore = pickle.load(f)
    
    # llm_forgraph = LLMChain(prompt=graphPrompt, llm=llm)

    chain = ConversationalRetrievalChain.from_llm(
        llm, VectorStore.as_retriever(search_kwargs={"k": 4}), return_source_documents=True,combine_docs_chain_kwargs={"prompt": prompt}
    )
    query = data["message"]
    result = chain.invoke({"question": query, "chat_history": chat_history})
    sorDb = FAISS.from_documents(result["source_documents"], embedding=embeddings)
    doc = sorDb.similarity_search(result['answer'])
    pages = [doc[0].metadata["page"],doc[1].metadata["page"]]
    return JSONResponse(content={"message": result["answer"], "pages":pages})

@app.post("/intro")
async def upload_file(file: UploadFile = File(...), id: str = Form(...)):
    contents = await file.read()
    store_name = id
    file_path = os.path.join("temp", "temp.pdf")

    with open(file_path, "wb") as f:
        f.write(contents)
    
    doc = fitz.open("temp/temp.pdf")
    pages=[]
    for page_no in range(doc.page_count):
        text = doc[page_no].get_text()
        text = text_splitter.split_text(text=text)
        for chunk in text:
            page = Document(page_content=chunk, metadata = {"page":page_no})
            pages.append(page)    
    doc.close()
    os.remove("temp/temp.pdf")
    VectorStore = FAISS.from_documents(pages, embedding=embeddings)
    with open(f"vectorestore/{store_name}.pkl", "wb") as f:
            pickle.dump(VectorStore, f)
    info = intro(VectorStore)
    llmforIntro = LLMChain(prompt=IntroPrompt, llm=llm)
    introduction = llmforIntro.run(info=info)
    return {"Intro": introduction}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
