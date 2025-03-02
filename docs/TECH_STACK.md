## Technology Stack

### **Backend**

- **Framework**: Next.js (API Routes)
- **LLM**: OpenAI GPT-4 API (initially) with optional self-hosted models (later stages)
- **Vector Database**: Supabase (PostgreSQL with pgvector)
- **Embeddings**: OpenAI's `text-embedding-ada-002`
- **Storage**: Supabase Storage (or AWS S3 for scalability)
- **Authentication**: Supabase Auth (OAuth, Magic Link, Email/Password)

### **Frontend**

- **Framework**: React (Next.js for full-stack handling)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (Next.js)

### **Chatbot Widget**

- **Implementation**: Embedded script (JS), iframe-based alternative
- **Messaging Protocol**: REST API
- **Customization**: Chat UI configurable via script params

### **Other Services**

- **Payments**: Stripe for subscriptions
- **Monitoring**: Sentry (error logging), PostHog (analytics)
- **Security**: JWT for API authentication, rate limiting
