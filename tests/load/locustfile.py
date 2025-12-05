from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login", json={
            "email": "admin@buildworks.ai",
            "password": "password"
        })
        if response.status_code == 200:
            self.client.headers.update(response.cookies)

    @task(3)
    def get_prompts(self):
        self.client.get("/api/prompts/")

    @task(1)
    def health_check(self):
        self.client.get("/health")

    # @task(1)
    # def run_inference(self):
    #     self.client.post("/api/inference", json={
    #         "model": "gpt-3.5-turbo",
    #         "input_text": "Hello world",
    #         "provider": "openai"
    #     })
