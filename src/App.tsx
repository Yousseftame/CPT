import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { routes } from "./routes/routes";

function App() {
  // src/main.tsx or App.tsx

  return (
    <>
      <RouterProvider router={routes} />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
      />
    </>
  );
}

export default App;