from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# document loader with llm 

# pypdf --> pdf data is converst in text by llm 

# context window --> fix size of data (The amount of the tax is known as the context window. )

data = PyPDFLoader("document loaders/GRU.pdf")

print(docs[14]) # pages no is 14 contails shoube there 
print(len(docs)) # length will be created of document 

docs = data.load()
# 
splitter = RecursiveCharacterTextSplitter(
    chunk_size = 1000, # this is size of chunk 
    chunk_overlap=10
)

chunks = splitter.split_documents(docs)

print(chunks[0].page_content)