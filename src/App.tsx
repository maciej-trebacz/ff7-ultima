import Home from "./Home";
import { FF7Provider } from "./FF7Context";
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  return (
    <FF7Provider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Home />
    </ThemeProvider>
    </FF7Provider>
  );
}

export default App;