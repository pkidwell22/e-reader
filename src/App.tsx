import { Routes, Route } from "react-router";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import LibraryPage from "@/pages/LibraryPage";
import ReadPage from "@/pages/ReadPage";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/read/:bookId" element={<ReadPage />} />
      </Routes>
    </ThemeProvider>
  );
}
