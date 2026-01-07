import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { routes } from "./routes/routes";
import { useEffect } from "react";

function App() {
  // src/main.tsx or App.tsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/recaptcha/releases/latest/recaptcha.js';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}, []);
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