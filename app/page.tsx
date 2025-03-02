export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          AI Customer Support Chatbot Builder
        </h1>
        <p className="text-center text-lg mb-8">
          Build and deploy AI-powered customer support chatbots with ease.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}
