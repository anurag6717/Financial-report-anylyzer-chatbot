from flask import Flask, jsonify, request
import fitz
from io import BytesIO


import re
from langchain.chains import ConversationalRetrievalChain
from langchain.text_splitter import RecursiveCharacterTextSplitter
# Embeddings
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.llms import HuggingFacePipeline
import io
import os
import pickle

from flask_cors import CORS
from decouple import config
from langchain_community.llms import Replicate

REPLICATE_API_TOKEN = config("REPLICATE_API_TOKEN")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
file_path=""
chat_history = []
llm = Replicate(
    model="a16z-infra/llama13b-v2-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",
    model_kwargs={"temperature": 0.75, "max_length": 3000}
)  

def pdfTextExtractor(pdf_document):>
    >    pdf_document.close()
    return text


@app.route('/')
def hello():
    return 'Hello, this is your Flask server on Colab with pyngrok!'

@app.route('/api/upload', methods=['POST'])
def upload_endpoint():
    if(request.method == 'POST'):
        if 'file' not in request.files:
            return "No file part", 404

        file = request.files['file']
        store_name = file.filename[:-4]
        file_content = file.read()
        if file_content:
        # Process the uploaded PDF file using the "fitz" module

            print(store_name, "d")
            # pdf_document = fitz.open(stream=file.read(), filetype="pdf")
            pdf_document = fitz.open(stream=BytesIO(file_content))
            text = pdfTextExtractor(pdf_document)
            text_splitter = RecursiveCharacterTextSplitter(
                        chunk_size=1000,
                        chunk_overlap=200,
                        length_function=len
                        )
            chunks = text_splitter.split_text(text=text)
            if os.path.exists(f"{store_name}.pkl"):
                return "file already in"
            else:
                embeddings = HuggingFaceEmbeddings()
                print("1")
                VectorStore = FAISS.from_texts(chunks, embedding=embeddings)
                print("2")
                with open(f"{store_name}.pkl", "wb") as f:
                    pickle.dump(VectorStore, f)
                return "file uploaded and stored"


@app.route('/api/generate', methods=['POST'])
def generate_response():
  data = request.json
  store_name = data["file"][:-4]
  with open(f"{store_name}.pkl", "rb") as f:
            VectorStore = pickle.load(f)
  chain = ConversationalRetrievalChain.from_llm(llm, VectorStore.as_retriever(), return_source_documents=True)
  query = data["message"]
  result = chain.invoke({"question": query, "chat_history": chat_history})


#   chain = ConversationalRetrievalChain.from_llm(llm, VectorStore.as_retriever())
#   result = chain({"question": query, "chat_history": chat_history})
#   chat_history.append((query, result["answer"]))
  
  return jsonify({'message': result["answer"]})



if __name__ == '__main__':
    app.run(debug=False)
