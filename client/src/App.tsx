import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FileComplaint from "./pages/FileComplaint";
import TrackComplaint from "./pages/TrackComplaint";
import VerifyRecord from "./pages/VerifyRecord";
import OfficialPortal from "./pages/OfficialPortal";
import AuditorConsole from "./pages/AuditorConsole";
import LegalHelp from "./pages/LegalHelp";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/file" component={FileComplaint} />
    <Route path="/track/:id" component={TrackComplaint} />
    <Route path="/verify" component={VerifyRecord} />
    <Route path="/official" component={OfficialPortal} />
    <Route path="/auditor" component={AuditorConsole} />
    <Route path="/legal" component={LegalHelp} />
    <Route path="/about" component={About} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}
