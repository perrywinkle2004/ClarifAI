import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import ChatList from "@/pages/chat-list";
import ChatDetail from "@/pages/chat-detail";
import Documents from "@/pages/documents";
import Quizzes from "@/pages/quizzes";
import QuizDetail from "@/pages/quiz-detail";
import QuizGenerator from "@/pages/quiz-generator";
import Flashcards from "@/pages/flashcards";
import FlashcardDetail from "@/pages/flashcard-detail";
import FlashcardGenerator from "@/pages/flashcard-generator";
import Progress from "@/pages/progress";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/about" component={About} />
      
      <Route path="/dashboard">
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/chat">
        <ProtectedRoute><AppLayout><ChatList /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/chat/:id">
        <ProtectedRoute><AppLayout><ChatDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/documents">
        <ProtectedRoute><AppLayout><Documents /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/quizzes">
        <ProtectedRoute><AppLayout><Quizzes /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/quizzes/:id">
        <ProtectedRoute><AppLayout><QuizDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/quiz-generator">
        <ProtectedRoute><AppLayout><QuizGenerator /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/flashcards">
        <ProtectedRoute><AppLayout><Flashcards /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/flashcards/:id">
        <ProtectedRoute><AppLayout><FlashcardDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/flashcard-generator">
        <ProtectedRoute><AppLayout><FlashcardGenerator /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/progress">
        <ProtectedRoute><AppLayout><Progress /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="clarifai-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
