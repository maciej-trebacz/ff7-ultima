import Home from "./Home";
import { FF7Provider } from "./FF7Context";

function App() {
  return (
    <FF7Provider>
      <Home />
    </FF7Provider>
  );
}

export default App;
