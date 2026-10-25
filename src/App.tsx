import { Route, Routes } from "react-router-dom";
import { EffectsToggle, Scene } from "./components/Scene";
import { useEffects } from "./hooks/useEffects";
import { useTheme } from "./hooks/useTheme";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import AnimePage from "./pages/AnimePage";
import Home from "./pages/Home";
import MyList from "./pages/MyList";
import Season from "./pages/Season";

export default function App() {
  const { on, toggle } = useEffects();
  const { theme } = useTheme();
  return (
    <>
      {on && <Scene theme={theme} />}
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista" element={<MyList />} />
        <Route path="/temporada" element={<Season />} />
        <Route path="/anime/:id" element={<AnimePage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <EffectsToggle on={on} onToggle={toggle} />
    </>
  );
}
