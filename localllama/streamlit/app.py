import os

os.environ['GOOGLE_API_KEY'] = 'AIzaSyB-El5bqssQA3lXC6GafmuDTupiPq838dI'
import streamlit as st

# from streamlit_pdf_viewer import pdf_viewer
from dotenv import load_dotenv
import re
import fitz
import time
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.retrievers.document_compressors import FlashrankRerank
from langchain.retrievers import ContextualCompressionRetriever
from langchain_core.prompts import ChatPromptTemplate
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.retrievers import RePhraseQueryRetriever
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain


from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory


store = {}



def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# Scroll to Top Button with HTML, CSS, and JavaScript
# scroll_to_top_button = """
#     <style>
   
#     #scrollToTopBtn {
#         position: fixed;
#         z-index: 9999;
#         font-size: 18px;
#         border: none;
#         outline: none;
#         background-color: #555;
#         color: white;
#         cursor: pointer;
#         padding: 15px;
#         border-radius: 4px;
#     }
#     #scrollToTopBtn:hover {
#         background-color: #333;
#     }
#     iframe{
#         position:absolute;
#     }
#     </style>

#     <button id="scrollToTopBtn" onclick="scrollToTop()">Top</button>

#     <script>
#     // Get the button
#     var mybutton = document.getElementById("scrollToTopBtn");
#     function scrollToTop() {
#             var body = window.parent.document.querySelector(".main");
#             body.scrollTop = 0;  // For Safari
#             document.documentElement.scrollTop = 0;  // For Chrome, Firefox, IE, and Opera
#         }
#     // When the user scrolls down 20px from the top of the document, show the button
#     window.onscroll = function() {scrollFunction()};

#     function scrollFunction() {
#       if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
#         mybutton.style.display = "block";
#       } else {
#         mybutton.style.display = "none";
#       }
#     }
#     </script>
#     """
    
    
js = '''
<script>
    var body = window.parent.document.querySelector(".main");
    console.log(body);
    body.scrollTop = 0;
</script>
'''

# Define the prompt template

system_prompt = (
    """You are a financial expert with access to the annual report of the company.
       When answering questions about the company's financial performance, prioritize information from the Financial Statements section.Considering the user's question, provide clear and concise answers from given context.
       If answer can be visulized format it into tabular form in text with its decriptive text.
       Note tried to format answer in tabular form for numerical values.
       {context}"""
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

IntroTemplate = """Based on this data:
{info}
on the basis of the following report give Overview of the annual report in short
overview:
"""

IntroPrompt = PromptTemplate.from_template(IntroTemplate)

QUERY_PROMPT = PromptTemplate(
    input_variables=["question"],
    template="""You are an assistant tasked with taking a natural languge query from a user
    and converting it into a query for a vectorstore. In the process, strip out all 
    information that is not relevant for the retrieval task and return a new, simplified
    question for vectorstore retrieval. Only return the new query text and dont format it.
    Also there might be some short notation and long notation in the query like CEO and Chief executive officer
    so for that it short or long notation should also present in new query vice versa.
    So in query is "CEO of copany" then in new query both Chief executive officer and CEO should present and vice versa/
    EX. query CEO of company new query Chief executive officer (CEO) of company
    Here is the user 
    query:{question}""",
)
load_dotenv()


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


def main():
    # st.header("Chat with PDF")
    # embeddings = HuggingFaceEmbeddings(model_name="../all-MiniLM-L6-v2")
    embeddings = GoogleGenerativeAIEmbeddings(model = "models/embedding-001")

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3,stream=True)
    llm_chain = LLMChain(llm=llm, prompt=QUERY_PROMPT).pick("text")
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    
    hide_streamlit_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            header{ display: none !important;}
            .main{
                padding:0rem 1rem;
            }
            .block-container {
                padding:0;
            }
            
            </style>
            """
            
    st.markdown(hide_streamlit_style, unsafe_allow_html=True)
     
    if 'pdf_ref' not in st.session_state:
        st.session_state.pdf_ref = None
    pdf = st.file_uploader("Upload your PDF", type='pdf')
    st.session_state.pdf_ref = pdf

    
    # with st.spinner("Processing your PDF"):
    #     if pdf is not None:
    #         if pdf:
    #                 binary_data = pdf.getvalue()
    #                 pdf_viewer(input=binary_data,width=700, pages_to_render=[1])
    
    if pdf is not None:
        if "vector_store" not in st.session_state:
            with st.spinner("creating the vector store..."):
                start_time = time.time()
                # Read and process the PDF
                doc = fitz.open(stream=pdf.read(), filetype="pdf")
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=2000,
                    chunk_overlap=200,
                    length_function=len
                )
                pages = []
                for page_no in range(doc.page_count):
                    text = doc[page_no].get_text()
                    text = re.sub(r"\n", " ", text)
                    text = text_splitter.split_text(text=text)
                    for chunk in text:
                        page = Document(page_content=chunk, metadata={"page": page_no + 1})
                        pages.append(page)

                # Create the FAISS vector store and store it in session state
                VectorStore = FAISS.from_documents(pages, embedding=embeddings)
                
                st.session_state.vector_store = VectorStore
                end_time = time.time()
                processing_time = end_time - start_time
                st.success(f"Vector store created successfully! {processing_time}")
            
                    # Initialize chat history
            if "messages" not in st.session_state:
                st.session_state.messages = []

            # Initialize chat history
            if "chat_history" not in st.session_state:
                st.session_state.chat_history = []
            info = intro(VectorStore)
            llmforIntro = LLMChain(prompt=IntroPrompt, llm=llm).pick("text")
            with st.spinner("creating the gist of report..."):
                introduction = llmforIntro.stream(info)
                with st.chat_message("assistant"):
                    res = st.write_stream(introduction)
                st.session_state.Intro = {"role": "assistant", "content":res}
        
        
    if "vector_store" in st.session_state:
        if "Intro" in st.session_state:
                res = st.write(st.session_state.Intro["content"])
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        
        retriever_from_llm_chain = RePhraseQueryRetriever(
                    retriever=st.session_state.vector_store.as_retriever(search_kwargs={"k": 4}), llm_chain=llm_chain
                )

        Fcompressor = FlashrankRerank(top_n=4)
        Flash_compression_retriever = ContextualCompressionRetriever(
            base_compressor=Fcompressor, base_retriever=retriever_from_llm_chain
        )

        rag_chain = create_retrieval_chain(Flash_compression_retriever,question_answer_chain)
        
        conversational_rag_chain = RunnableWithMessageHistory(
            rag_chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )


        if query:=st.chat_input("Ask questions about your PDF file:"):
                st.session_state.messages.append({"role": "user", "content": query})
                with st.chat_message("user"):
                    st.markdown(query)
                with st.chat_message("assistant"):
                    stream = conversational_rag_chain.pick("answer").stream({"input": query}, config={"configurable": {"session_id": "abc123"}})
                    response = st.write_stream(stream)
                    st.session_state.messages.append({"role": "assistant", "content": response})
                    print(response)
if __name__ == '__main__':
    main()