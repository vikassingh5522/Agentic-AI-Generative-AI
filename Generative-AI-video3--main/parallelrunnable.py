# 21  Runnable Parallel 

# Parallel = multiple Runnables run at the same time. 

# For example, you want to get two different pieces of information from the same input:
            
# chain = RunnableParallel(
#     summary=summary_chain,
#     translation=translation_chain
# )

# Both chains can process the input independently.

# Easy definition:
# Runnable Parallel executes multiple Runnables simultaneously and combines their results



from dotenv import load_dotenv
load_dotenv()

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel,RunnableLambda

# Components
model = ChatMistralAI(model="mistral-small-2506")
parser = StrOutputParser()

# Two different prompts
short_prompt = ChatPromptTemplate.from_template(
    "Explain {topic} in 1-2 lines"
)

detailed_prompt = ChatPromptTemplate.from_template(
    "Explain {topic} in detail"
)

# Input
topic = "Machine Learning"

chain = RunnableParallel({
    "short" :RunnableLambda(lambda x :x['short']) |short_prompt | model | parser ,
    "detailed" :RunnableLambda(lambda x: x['detailed']) |detailed_prompt |model |parser
})


# ['short']) |short_prompt | model |   --> short proment 
# ['detailed']) |detailed_prompt |model |parser  --> details proment  



# parallerunables 

result = chain.invoke({
    "short" : {"topic":"Machine Learning"},
    "detailed" : {"topic":"Deep Learning"}
})

print(result['short'])
print(result['detailed'])
