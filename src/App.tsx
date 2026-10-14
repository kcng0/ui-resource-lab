import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.tsx";
import { BrowsePage } from "./pages/BrowsePage.tsx";
import { DetailPage, NotFoundPage } from "./pages/DetailPage.tsx";
import { InboxPage } from "./pages/InboxPage.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<BrowsePage />} />
          <Route path="r/:id" element={<DetailPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="inbox/:id" element={<DetailPage queue />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
