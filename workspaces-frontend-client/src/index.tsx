import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, BrowserRouter as Router } from "react-router-dom";
import { LoaderProvider } from "./contexts/LoaderContext";
import { SocketProvider } from "./contexts/SocketContext";
import { workspacesWebsocketBaseUrl } from './utils/config';

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <LoaderProvider>
    <SocketProvider socketUrl={workspacesWebsocketBaseUrl}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SocketProvider>
  </LoaderProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
