import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm mx-auto px-6">
        <div className="text-8xl font-bold font-serif text-primary/20">404</div>
        <h1 className="text-2xl font-serif font-bold">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
