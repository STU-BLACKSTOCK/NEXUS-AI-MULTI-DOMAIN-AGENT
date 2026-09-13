import { useState, type FormEvent } from "react";
import { Send, Mail, MessageCircle } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Placeholder — would connect to a backend endpoint
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-xl animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold">Contact & Feedback</h1>
        </div>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Have feedback, questions, or suggestions? We'd love to hear from you.
        </p>

        {submitted ? (
          <div className="glass rounded-xl p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-domain-active/20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-domain-active" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-sm text-muted-foreground">Your message has been received. We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">Name</label>
              <input
                id="name"
                type="text"
                required
                className="w-full bg-secondary/50 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                className="w-full bg-secondary/50 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                id="message"
                required
                rows={4}
                className="w-full bg-secondary/50 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Your feedback or question..."
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all glow-sm"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
