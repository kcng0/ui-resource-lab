import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.tsx";
import { BrowsePage } from "./pages/BrowsePage.tsx";
import { DetailPage, NotFoundPage } from "./pages/DetailPage.tsx";
import { InboxPage } from "./pages/InboxPage.tsx";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
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
