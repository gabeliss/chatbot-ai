## **Endpoints**

### **1. Upload Document**

```
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: {file}
```

- Parses document, generates embeddings, and stores in DB.

### **2. Ask a Question**

```
POST /api/ask
Authorization: Bearer {token}
Body: {
    "botId": "12345",
    "question": "How do I reset my password?"
}
```

- Uses vector search + GPT to generate responses.

### **3. Embed Chatbot**

```
<iframe src="https://yourapp.com/embed/{botId}" style="width: 100%; height: 400px;"></iframe>
```

- Allows embedding chatbot into business websites.
