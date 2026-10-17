"""The Bedrock model the agent uses. Change the model with BEDROCK_MODEL_ID in .env."""

from functools import lru_cache

from langchain_aws import ChatBedrockConverse

from app.config import AWS_REGION, BEDROCK_MODEL_ID


@lru_cache
def get_llm():
    return ChatBedrockConverse(
        model=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
        max_tokens=4096,
        temperature=0,
    )
