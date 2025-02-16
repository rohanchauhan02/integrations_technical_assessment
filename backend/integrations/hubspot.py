# hubspot.py

import os
import json
import secrets
import base64
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
from redis_client import add_key_value_redis, get_value_redis, delete_key_redis
from integrations.integration_item import IntegrationItem

CLIENT_ID = os.getenv("HUBSPOT_CLIENT_ID")
CLIENT_SECRET = os.getenv("HUBSPOT_CLIENT_SECRET")
REDIRECT_URI = os.getenv(
    "HUBSPOT_REDIRECT_URI", "http://localhost:8000/integrations/airtable/oauth2callback"
)
BASE_URL = os.getenv("HUBSPOT_BASE_URL", "https://app.hubspot.com")

AUTHORIZATION_URL = (
    f"{BASE_URL}/oauth/authorize"
    f"?client_id={CLIENT_ID}"
    f"&redirect_uri={REDIRECT_URI}"
    f"&scope=crm.objects.contacts.read"
)


async def authorize_hubspot(user_id: str, org_id: str) -> str:
    state_data = {
        "state": secrets.token_urlsafe(32),
        "user_id": user_id,
        "org_id": org_id,
    }
    encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
    await add_key_value_redis(
        f"hubspot_state:{org_id}:{user_id}", encoded_state, expire=600
    )
    return f"{AUTHORIZATION_URL}&state={encoded_state}"


async def oauth2callback_hubspot(request: Request):
    error = request.query_params.get("error")
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth2 Error: {error}")

    code = request.query_params.get("code")
    requested_state = request.query_params.get("state")
    if not code or not requested_state:
        raise HTTPException(
            status_code=400, detail="Missing code or state in callback."
        )

    try:
        state_data = json.loads(
            base64.urlsafe_b64decode(requested_state.encode()).decode()
        )
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid state parameter.")

    user_id = state_data.get("user_id")
    org_id = state_data.get("org_id")

    saved_state = await get_value_redis(f"hubspot_state:{org_id}:{user_id}")
    if saved_state:
        if isinstance(saved_state, bytes):
            saved_state = saved_state.decode("utf-8")
        if requested_state != saved_state:
            raise HTTPException(status_code=400, detail="State mismatch or expired.")
    else:
        raise HTTPException(status_code=400, detail="State not found or expired.")

    token_url = f"{BASE_URL}/oauth/v1/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": code,
    }
    token_headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=token_data, headers=token_headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code, detail="Failed to retrieve access token."
        )

    credentials = response.json()
    await add_key_value_redis(
        f"hubspot_credentials:{org_id}:{user_id}",
        json.dumps(credentials),
        expire=credentials.get("expires_in", 3600),
    )
    await delete_key_redis(f"hubspot_state:{org_id}:{user_id}")

    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)


async def get_hubspot_credentials(user_id: str, org_id: str) -> dict:
    credentials = await get_value_redis(f"hubspot_credentials:{org_id}:{user_id}")
    if not credentials:
        raise HTTPException(status_code=400, detail="No credentials found.")
    return json.loads(credentials)


def create_integration_item_metadata_object(response_json: dict) -> IntegrationItem:
    return IntegrationItem(
        id=response_json.get("id"),
        type="hubspot_object",
        name=response_json.get("properties", {}).get("firstname", "Unknown"),
        creation_time=response_json.get("createdAt"),
        last_modified_time=response_json.get("updatedAt"),
        parent_id=None,
    )


async def get_items_hubspot(credentials: dict):
    credentials = json.loads(credentials)
    headers = {
        "Authorization": f"Bearer {credentials['access_token']}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.hubapi.com/crm/v3/objects/contacts", headers=headers
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code, detail="Failed to fetch HubSpot contacts."
        )

    results = response.json().get("results", [])
    return [create_integration_item_metadata_object(item) for item in results]
