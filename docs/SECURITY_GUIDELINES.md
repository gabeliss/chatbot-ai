## **1. API Security**

- Use JWT-based authentication for all endpoints.
- Implement rate limiting (e.g., 5 requests per second per user).

## **2. User Data Protection**

- Encrypt stored user data and documents.
- Ensure API does not expose raw user data in logs.

## **3. Preventing Model Hallucinations**

- AI only answers based on indexed content.
- Use confidence thresholding to avoid wrong answers.
- Allow business owners to review unanswered questions for future training.
