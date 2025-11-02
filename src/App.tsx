import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import DeepInsights from "./pages/DeepInsights";
import Highlights from "./pages/Highlights";
import Archetype from "./pages/Archetype";
import GrowthMap from "./pages/GrowthMap";
import SocialComparisons from "./pages/SocialComparisons";
import ShareableMoments from "./pages/ShareableMoments";
import Finale from "./pages/Finale";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/deep-insights" element={<DeepInsights />} />
					<Route path="/highlights" element={<Highlights />} />
					<Route path="/archetype" element={<Archetype />} />
					<Route path="/growth-map" element={<GrowthMap />} />
					<Route path="/social" element={<SocialComparisons />} />
					<Route path="/shareable" element={<ShareableMoments />} />
					<Route path="/finale" element={<Finale />} />
					{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
