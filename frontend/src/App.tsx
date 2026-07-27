import type { ReactElement } from "react";
import { RouterProvider } from "react-router-dom";

import { PlayerRoot } from "./components/player/player-root";
import { router } from "./routes";

export default function App(): ReactElement {
  return (
    <>
      <RouterProvider router={router} />
      <PlayerRoot />
    </>
  );
}
