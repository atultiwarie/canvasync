import CanvasBoard from "./features/canvas/components/CanvasBoard";
import CanvasToolbar from "./features/canvas/components/CanvasToolbar";

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <CanvasBoard />

      <CanvasToolbar />
    </div>
  );
}

export default App;
