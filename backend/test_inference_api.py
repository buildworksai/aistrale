import requests

API_URL = "http://localhost:8000/api/inference/run"
TOKENS_URL = "http://localhost:8000/api/tokens/"

LOGIN_URL = "http://localhost:8000/api/auth/login"


def get_session():
    s = requests.Session()
    data = {"email": "admin@buildworks.ai", "password": "admin@134"}
    res = s.post(LOGIN_URL, json=data)
    if res.status_code != 200:  # noqa: PLR2004
        print(f"Login failed: {res.text}")
        return None
    # Assuming the login response contains an access_token
    # that needs to be set as a Bearer token for subsequent requests.
    # If the server uses cookies for session management after /api/auth/login,
    # this part might not be strictly necessary.
    try:
        token = res.json()["access_token"]
        s.headers.update({"Authorization": f"Bearer {token}"})
    except KeyError:
        print(
            "Warning: 'access_token' not found in login response. "
            "Assuming session cookies are used."
        )
    return s


def get_groq_token(session):
    try:
        res = session.get(TOKENS_URL)
        tokens = res.json()
        if not isinstance(tokens, list):
            print(f"Unexpected response format: {tokens}")
            return None
        for t in tokens:
            if t["provider"] == "groq":
                return t["id"]
        return None
    except Exception as e:
        print(f"Error fetching tokens: {e}")
        return None


def test_inference():
    session = get_session()
    if not session:
        return

    token_id = get_groq_token(session)
    if not token_id:
        print("No Groq token found. Please create one first.")
        return

    payload = {
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "input_text": "What is 2+2?",
        "token_id": token_id,
        "hf_provider": "auto",
        "task": "auto",
    }

    print(f"Sending request with token_id: {token_id}")
    try:
        res = session.post(API_URL, json=payload)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error sending request: {e}")


if __name__ == "__main__":
    test_inference()
