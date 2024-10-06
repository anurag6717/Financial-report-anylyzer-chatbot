from langchain.chains import LLMChain
from langchain_community.llms import GradientLLM
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler


class Loadllm:
    @staticmethod
    def load_llm():
        # callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
        # Prepare the LLM

        llm = GradientLLM(
            # `ID` listed in `$ gradient model list`
            model="34753ee8-28a7-442a-9b3f-0ce906c66fb9_model_adapter",
            # # optional: set new credentials, they default to environment variables
            # gradient_workspace_id=os.environ["GRADIENT_WORKSPACE_ID"],
            # gradient_access_token=os.environ["GRADIENT_ACCESS_TOKEN"],
            model_kwargs=dict(max_generated_token_count=400,temperature= 0.75, max_length= 3000, Stream=True),
            # callback_manager= callback_manager,
            callbacks=[StreamingStdOutCallbackHandler()]
        )

        return llm