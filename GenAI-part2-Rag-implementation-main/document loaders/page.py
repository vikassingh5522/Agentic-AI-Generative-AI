

# WebBaseLoader  ->  llm will into the weside rearch according to context and giive the Ans.  

from langchain_community.document_loaders import WebBaseLoader


# web url 
url = "https://www.apple.com/in/macbook-pro/"


#A Text Splitter is a tool used to break a large text/document into smaller pieces (chunks).

#  now large document all the contain shoud be comvert into chunks 

data = WebBaseLoader(url)

docs = data.load()

print(docs[0].page_content)