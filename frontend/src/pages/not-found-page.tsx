import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/common/button";

export function NotFoundPage(): ReactElement {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-extrabold text-ms-primary">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-ms-muted">
        The track skipped — this page doesn’t exist or was moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/home">
          <Button>Back to home</Button>
        </Link>
        <Link to="/search">
          <Button variant="secondary">Search music</Button>
        </Link>
      </div>
    </div>
  );
}
